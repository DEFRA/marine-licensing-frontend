import {
  marineLicenceRoutes,
  apiRoutes
} from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { getCdpErrorMessageFromCode } from '#src/server/common/helpers/file-upload/file-upload.js'
import { handleReadyStatus } from '#src/server/common/helpers/file-upload/upload-status-handler.js'
import { DEFAULT_ERROR_MESSAGE } from '#src/server/common/helpers/file-upload/error-messages.js'
import {
  UPLOAD_AND_WAIT_VIEW_ROUTE,
  uploadAndWaitPageSettings
} from '#src/server/common/helpers/file-upload/constants.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { config } from '#src/config/config.js'
import { getConstructionDrawingBackLink } from '#src/server/marine-licence/site-details/utils/back-link.js'

async function storeUploadError(request, h, errorDetails, siteIndex) {
  await updateMarineLicenceSiteDetails(request, h, siteIndex, 'uploadError', {
    message: errorDetails.message,
    fieldName: errorDetails.fieldName,
    fileType: 'construction-drawing'
  })
  await updateMarineLicenceSiteDetails(
    request,
    h,
    siteIndex,
    'uploadConfig',
    null
  )
}

async function handleRejectedStatus(status, uploadConfig, request, h) {
  const errorMessage = status.errorCode
    ? getCdpErrorMessageFromCode(status.errorCode, 'construction-drawing')
    : DEFAULT_ERROR_MESSAGE

  request.logger.error(
    {
      error: {
        code: status.errorCode,
        message: status.message,
        type: 'construction-drawing'
      }
    },
    'ConstructionDrawingUpload: CDP rejection error'
  )

  await storeUploadError(
    request,
    h,
    { message: errorMessage, fieldName: 'file' },
    uploadConfig.siteIndex
  )

  return h.redirect(
    `${marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING}?site=${uploadConfig.siteIndex + 1}&drawing=${uploadConfig.drawingIndex + 1}`
  )
}

function handleProcessingStatus(status, marineLicence, h) {
  return h.view(UPLOAD_AND_WAIT_VIEW_ROUTE, {
    ...uploadAndWaitPageSettings,
    projectName: marineLicence.projectName,
    isProcessing: true,
    filename: status.filename,
    tryAgainLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
    cancelLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
  })
}

async function processValidatedFile(
  status,
  uploadConfig,
  request,
  h,
  marineLicence
) {
  const { siteIndex, drawingIndex } = uploadConfig
  const cdpUploadConfig = config.get('cdpUploader')

  await authenticatedPatchRequest(
    request,
    apiRoutes.UPDATE_CONSTRUCTION_DRAWING,
    {
      id: marineLicence.id,
      siteIndex,
      drawingIndex,
      filename: status.filename,
      s3Location: {
        s3Bucket: cdpUploadConfig.s3Bucket,
        s3Key: status.s3Location.s3Key,
        checksumSha256: status.s3Location.checksumSha256
      }
    }
  )

  await updateMarineLicenceSiteDetails(
    request,
    h,
    siteIndex,
    'uploadConfig',
    null
  )

  return h.redirect(
    getConstructionDrawingBackLink(siteIndex + 1, drawingIndex + 1)
  )
}

async function processUploadStatus(status, context) {
  const { uploadConfig, request, h, marineLicence } = context

  if (status.status === 'pending' || status.status === 'scanning') {
    return handleProcessingStatus(status, marineLicence, h)
  }

  if (status.status === 'ready') {
    const redirect = await handleReadyStatus(status, uploadConfig, request, h, {
      storeUploadError: (req, hh, errorDetails) =>
        storeUploadError(req, hh, errorDetails, uploadConfig.siteIndex),
      fileUploadRoute: `${marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING}?site=${uploadConfig.siteIndex + 1}&drawing=${uploadConfig.drawingIndex + 1}`
    })
    if (redirect) {
      return redirect
    }
    return processValidatedFile(status, uploadConfig, request, h, marineLicence)
  }

  if (status.status === 'rejected' || status.status === 'error') {
    return handleRejectedStatus(status, uploadConfig, request, h)
  }

  request.logger.warn(
    { uploadId: uploadConfig.uploadId, status: status.status },
    'ConstructionDrawingUpload: Unknown upload status'
  )

  return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
}

export const uploadConstructionDrawingWaitController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { site } = request.query

    if (!site) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
    }

    const siteIndex = Number.parseInt(site, 10) - 1
    const siteDetails = marineLicence.siteDetails?.[siteIndex]
    const { uploadConfig } = siteDetails ?? {}

    if (!uploadConfig) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
    }

    try {
      const cdpService = getCdpUploadService()
      const status = await cdpService.getStatus(
        uploadConfig.uploadId,
        uploadConfig.statusUrl
      )

      return await processUploadStatus(status, {
        uploadConfig,
        request,
        h,
        marineLicence
      })
    } catch (error) {
      request.logger.error(
        { err: error, uploadId: uploadConfig.uploadId },
        'ConstructionDrawingUpload: ERROR: Failed to check upload status'
      )

      await updateMarineLicenceSiteDetails(
        request,
        h,
        siteIndex,
        'uploadConfig',
        null
      )

      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
    }
  }
}
