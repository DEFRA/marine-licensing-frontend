import { config } from '#src/config/config.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { DEFAULT_ERROR_MESSAGE } from '#src/server/common/helpers/file-upload/error-messages.js'
import {
  UPLOAD_AND_WAIT_VIEW_ROUTE,
  uploadAndWaitPageSettings
} from '#src/server/common/helpers/file-upload/constants.js'
import { getCdpErrorMessageFromCode } from '#src/server/common/helpers/file-upload/file-upload.js'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import { getViewDetailsUrl } from '#src/server/common/helpers/view-details/utils.js'
import {
  findSiteNoticeTask,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import {
  getPhotoUploadSession,
  PHOTO_FILE_SIZE_ERROR_MESSAGE,
  PHOTO_FILE_TYPE_ERROR_MESSAGE,
  setPhotoUploadSession,
  siteNoticeDisplayUrl
} from '#src/server/marine-licence/site-notice/utils.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png'])
const PROCESSING_STATUSES = new Set(['pending', 'scanning'])
const FAILED_STATUSES = new Set(['rejected', 'error'])
const REJECTION_MESSAGES = {
  FILE_TOO_LARGE: PHOTO_FILE_SIZE_ERROR_MESSAGE,
  INVALID_FILE_TYPE: PHOTO_FILE_TYPE_ERROR_MESSAGE
}

const rejectionMessage = (errorCode) => {
  if (!errorCode) {
    return DEFAULT_ERROR_MESSAGE
  }
  return REJECTION_MESSAGES[errorCode] ?? getCdpErrorMessageFromCode(errorCode)
}

const isAllowedFileType = (s3Location) => {
  const detected = s3Location?.detectedContentType
  return !detected || ALLOWED_MIME_TYPES.has(detected)
}

const failUpload = async ({ request, h, uploadPageUrl }, message) => {
  await setPhotoUploadSession(request, h, {
    uploadError: { message, fieldName: 'file' }
  })
  return h.redirect(uploadPageUrl)
}

const savePhoto = async (status, context) => {
  const { request, h, field } = context

  if (!isAllowedFileType(status.s3Location)) {
    return failUpload(context, PHOTO_FILE_TYPE_ERROR_MESSAGE)
  }

  try {
    await authenticatedPatchRequest(
      request,
      apiRoutes.UPDATE_SITE_NOTICE_EVIDENCE,
      {
        [field]: {
          uploadedFile: { filename: status.filename },
          s3Location: {
            s3Bucket: config.get('cdpUploader').s3Bucket,
            s3Key: status.s3Location?.s3Key,
            checksumSha256: status.s3Location?.checksumSha256
          }
        },
        id: request.params.marineLicenceId,
        evidenceIndex: Number.parseInt(request.query.location, 10) - 1
      }
    )
  } catch (error) {
    if (error.output?.statusCode === statusCodes.unsupportedMediaType) {
      return failUpload(context, PHOTO_FILE_TYPE_ERROR_MESSAGE)
    }
    throw error
  }

  await setPhotoUploadSession(request, h, {})
  return h.redirect(siteNoticeDisplayUrl(request.params.marineLicenceId))
}

const processUploadStatus = (status, context) => {
  const { request, h, uploadPageUrl, marineLicence } = context

  if (PROCESSING_STATUSES.has(status.status)) {
    return h.view(UPLOAD_AND_WAIT_VIEW_ROUTE, {
      ...uploadAndWaitPageSettings,
      projectName: marineLicence.projectName,
      isProcessing: true,
      filename: status.filename,
      tryAgainLink: uploadPageUrl,
      cancelLink: siteNoticeDisplayUrl(request.params.marineLicenceId)
    })
  }

  if (status.status === 'ready') {
    return savePhoto(status, context)
  }

  if (FAILED_STATUSES.has(status.status)) {
    request.logger.error(
      { error: { code: status.errorCode, message: status.message } },
      'Site notice photo upload: CDP rejection error'
    )
    return failUpload(context, rejectionMessage(status.errorCode))
  }

  request.logger.warn(
    { status: status.status },
    'Site notice photo upload: Unknown upload status'
  )
  return h.redirect(uploadPageUrl)
}

export const siteNoticePhotoUploadAndWaitController = {
  options: {
    ...validateMarineLicenceIdParams,
    pre: [validateEvidenceParam]
  },
  async handler(request, h) {
    const { marineLicenceId } = request.params
    const marineLicence = request.marineLicence

    if (!findSiteNoticeTask(marineLicence)) {
      return h.redirect(getViewDetailsUrl(marineLicenceId))
    }

    const { uploadId, statusUrl, field, uploadPageUrl } =
      getPhotoUploadSession(request)

    if (!uploadId) {
      return h.redirect(siteNoticeDisplayUrl(marineLicenceId))
    }

    try {
      const status = await getCdpUploadService().getStatus(uploadId, statusUrl)
      return await processUploadStatus(status, {
        request,
        h,
        field,
        uploadPageUrl,
        marineLicence
      })
    } catch (error) {
      request.logger.error(
        { err: error },
        'Site notice photo upload: Failed to check upload status'
      )
      await setPhotoUploadSession(request, h, {})
      return h.redirect(uploadPageUrl)
    }
  }
}
