import { config } from '#src/config/config.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { DEFAULT_ERROR_MESSAGE } from '#src/server/common/helpers/file-upload/error-messages.js'
import {
  UPLOAD_AND_WAIT_VIEW_ROUTE,
  uploadAndWaitPageSettings
} from '#src/server/common/helpers/file-upload/constants.js'
import { getCdpErrorMessageFromCode } from '#src/server/common/helpers/file-upload/file-upload.js'
import {
  getPhotoUploadSession,
  PHOTO_ALLOWED_MIME_TYPES,
  PHOTO_FILE_SIZE_ERROR_MESSAGE,
  PHOTO_FILE_TYPE_ERROR_MESSAGE,
  setPhotoUploadSession
} from '#src/server/marine-licence/site-notice/utils.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'

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

const isAllowedFileType = (s3Location) =>
  PHOTO_ALLOWED_MIME_TYPES.includes(s3Location?.detectedContentType)

const failUpload = async ({ request, h, uploadPageUrl }, message) => {
  await setPhotoUploadSession(request, h, {
    uploadError: { message, fieldName: 'file' }
  })
  return h.redirect(uploadPageUrl)
}

const buildPhoto = (status) => ({
  uploadedFile: { filename: status.filename },
  s3Location: {
    s3Bucket: config.get('cdpUploader').s3Bucket,
    s3Key: status.s3Location?.s3Key,
    checksumSha256: status.s3Location?.checksumSha256
  }
})

const savePhoto = async (status, context) => {
  const { request, h, field, persistPhoto, returnUrl } = context

  if (!isAllowedFileType(status.s3Location)) {
    return failUpload(context, PHOTO_FILE_TYPE_ERROR_MESSAGE)
  }

  try {
    await persistPhoto(request, field, buildPhoto(status))
  } catch (error) {
    if (error.output?.statusCode === statusCodes.unsupportedMediaType) {
      return failUpload(context, PHOTO_FILE_TYPE_ERROR_MESSAGE)
    }
    if (error.output?.statusCode === statusCodes.notFound) {
      request.logger.warn(
        { err: error },
        'Site notice photo upload: Nothing to save the photo against'
      )
      await setPhotoUploadSession(request, h, {})
      return h.redirect(returnUrl)
    }
    throw error
  }

  await setPhotoUploadSession(request, h, {})
  return h.redirect(returnUrl)
}

const processUploadStatus = (status, context) => {
  const { request, h, uploadPageUrl, marineLicence, returnUrl } = context

  if (PROCESSING_STATUSES.has(status.status)) {
    return h.view(UPLOAD_AND_WAIT_VIEW_ROUTE, {
      ...uploadAndWaitPageSettings,
      projectName: marineLicence.projectName,
      isProcessing: true,
      filename: status.filename,
      tryAgainLink: uploadPageUrl,
      cancelLink: returnUrl
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
    { tenant: { message: `status: ${status.status}` } },
    'Site notice photo upload: Unknown upload status'
  )
  return h.redirect(uploadPageUrl)
}

export const handlePhotoUploadStatus = async (
  request,
  h,
  { marineLicence, persistPhoto, returnUrl, noUploadUrl = returnUrl }
) => {
  const { uploadId, statusUrl, field, uploadPageUrl } =
    getPhotoUploadSession(request)

  if (!uploadId) {
    return h.redirect(noUploadUrl)
  }

  try {
    const status = await getCdpUploadService().getStatus(uploadId, statusUrl)
    return await processUploadStatus(status, {
      request,
      h,
      field,
      uploadPageUrl,
      marineLicence,
      persistPhoto,
      returnUrl
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
