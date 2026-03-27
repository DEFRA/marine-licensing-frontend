import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import {
  getExemptionCache,
  updateExemptionMultipleSiteDetails,
  updateExemptionSiteDetails,
  updateExemptionSiteDetailsBatch
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import {
  isMultipleSitesFile,
  getCdpErrorMessageFromCode,
  getGeoParserErrorMessage
} from '#src/server/common/helpers/file-upload/file-upload.js'
import {
  extractCoordinates,
  extractGeoParserErrorCode
} from '#src/server/common/helpers/file-upload/geo-parse-upload.js'
import { handleReadyStatus } from '#src/server/common/helpers/file-upload/upload-status-handler.js'
import { logSuccessfulProcessing } from '#src/server/common/helpers/file-upload/upload-logging.js'
import { DEFAULT_ERROR_MESSAGE } from '#src/server/common/helpers/file-upload/error-messages.js'
import {
  UPLOAD_AND_WAIT_VIEW_ROUTE,
  uploadAndWaitPageSettings
} from '#src/server/common/helpers/file-upload/constants.js'

async function handleGeoParserError(request, h, error, filename, fileType) {
  const errorCode = extractGeoParserErrorCode(error)
  const message = getGeoParserErrorMessage(errorCode)

  const errorDetails = {
    message,
    fieldName: 'file',
    fileType
  }

  await storeUploadError(request, h, errorDetails, fileType)

  request.logger.error(
    {
      err: error,
      filename,
      fileType,
      errorCode,
      mappedMessage: message
    },
    'FileUpload: ERROR: Failed to extract coordinates from uploaded file'
  )

  return { redirect: routes.FILE_UPLOAD }
}

async function handleCdpRejectionError(request, h, status, fileType) {
  const errorMessage = status.errorCode
    ? getCdpErrorMessageFromCode(status.errorCode, fileType)
    : DEFAULT_ERROR_MESSAGE

  const errorDetails = {
    message: errorMessage,
    fieldName: 'file'
  }

  request.logger.error(
    {
      error: {
        code: status.errorCode,
        message: status.message,
        type: fileType
      }
    },
    'FileUpload: CDP rejection error'
  )

  await storeUploadError(request, h, errorDetails, fileType)
  return { redirect: routes.FILE_UPLOAD }
}

async function clearUploadSession(request, h) {
  await updateExemptionSiteDetails(request, h, 0, 'uploadConfig', null)
}

async function storeUploadError(request, h, errorDetails, fileType) {
  await updateExemptionSiteDetails(request, h, 0, 'uploadError', {
    message: errorDetails.message,
    fieldName: errorDetails.fieldName,
    fileType
  })
  await clearUploadSession(request, h)
}

function handleProcessingStatus(status, exemption, h) {
  return h.view(UPLOAD_AND_WAIT_VIEW_ROUTE, {
    ...uploadAndWaitPageSettings,
    projectName: exemption.projectName,
    isProcessing: true,
    filename: status.filename,
    tryAgainLink: routes.FILE_UPLOAD,
    cancelLink: routes.TASK_LIST
  })
}

const processValidatedFile = async (status, uploadConfig, request, h) => {
  try {
    const cdpUploadConfig = config.get('cdpUploader')

    const coordinateData = await extractCoordinates({
      status,
      uploadConfig,
      request,
      h
    })

    await updateExemptionMultipleSiteDetails(
      request,
      h,
      'multipleSitesEnabled',
      isMultipleSitesFile(coordinateData)
    )

    updateExemptionSiteDetailsBatch(
      request,
      status,
      coordinateData,
      {
        s3Bucket: cdpUploadConfig.s3Bucket,
        s3Key: status.s3Location.s3Key
      },
      {
        isMultipleSitesFile: isMultipleSitesFile(coordinateData)
      }
    )

    logSuccessfulProcessing(request, status, uploadConfig, coordinateData)

    if (isMultipleSitesFile(coordinateData)) {
      return h.redirect(routes.SAME_ACTIVITY_DATES)
    }

    return h.redirect(routes.ACTIVITY_DATES)
  } catch (error) {
    await handleGeoParserError(
      request,
      h,
      error,
      status.filename,
      uploadConfig.fileType
    )
    return h.redirect(routes.FILE_UPLOAD)
  }
}

async function handleRejectedStatus(status, uploadConfig, request, h) {
  // Handle CDP rejection/error and redirect
  await handleCdpRejectionError(request, h, status, uploadConfig.fileType)
  return h.redirect(routes.FILE_UPLOAD)
}

function handleUnknownStatus(request, uploadConfig, status, h) {
  // Unknown status - redirect to file type selection
  request.logger.warn(
    {
      uploadId: uploadConfig.uploadId,
      status: status.status
    },
    'FileUpload: Unknown upload status'
  )

  return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
}

async function processUploadStatus(status, context) {
  const { uploadConfig, request, h, exemption } = context
  request.logger.debug(
    `Upload status check:  ${JSON.stringify(
      {
        uploadId: uploadConfig.uploadId,
        status: status.status,
        filename: status.filename
      },
      null,
      2
    )}`
  )

  if (status.status === 'pending' || status.status === 'scanning') {
    return handleProcessingStatus(status, exemption, h)
  }

  if (status.status === 'ready') {
    const redirect = await handleReadyStatus(status, uploadConfig, request, h, {
      storeUploadError,
      fileUploadRoute: routes.FILE_UPLOAD
    })
    if (redirect) {
      return redirect
    }
    return processValidatedFile(status, uploadConfig, request, h)
  }

  if (status.status === 'rejected' || status.status === 'error') {
    return handleRejectedStatus(status, uploadConfig, request, h)
  }

  // Unknown status
  return handleUnknownStatus(request, uploadConfig, status, h)
}

export const uploadAndWaitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const site = getSiteDetailsBySite(exemption)

    const { uploadConfig } = site

    if (!uploadConfig) {
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
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
        exemption
      })
    } catch (error) {
      request.logger.error(
        {
          err: error,
          uploadId: uploadConfig.uploadId
        },
        'FileUpload: ERROR: Failed to check upload status'
      )

      // Clear upload config and redirect to file type selection
      await updateExemptionSiteDetails(request, h, 0, 'uploadConfig', null)
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }
  }
}
