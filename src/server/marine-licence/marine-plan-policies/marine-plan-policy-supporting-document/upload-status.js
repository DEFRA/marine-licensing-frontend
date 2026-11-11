import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { DEFAULT_ERROR_MESSAGE } from '#src/server/common/helpers/file-upload/error-messages.js'
import {
  UPLOAD_AND_WAIT_VIEW_ROUTE,
  uploadAndWaitPageSettings
} from '#src/server/common/helpers/file-upload/constants.js'
import { getCdpErrorMessageFromCode } from '#src/server/common/helpers/file-upload/file-upload.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_FILE_SIZE_ERROR_MESSAGE,
  DOCUMENT_FILE_TYPE_ERROR_MESSAGE
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/constants.js'
import {
  getMarinePlanPolicySupportingDocumentUploadSession,
  setMarinePlanPolicySupportingDocumentUploadSession
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/utils.js'

const PROCESSING_STATUSES = new Set(['pending', 'scanning'])
const FAILED_STATUSES = new Set(['rejected', 'error'])
const REJECTION_MESSAGES = {
  FILE_TOO_LARGE: DOCUMENT_FILE_SIZE_ERROR_MESSAGE,
  INVALID_FILE_TYPE: DOCUMENT_FILE_TYPE_ERROR_MESSAGE
}

const rejectionMessage = (errorCode) => {
  if (!errorCode) {
    return DEFAULT_ERROR_MESSAGE
  }
  return REJECTION_MESSAGES[errorCode] ?? getCdpErrorMessageFromCode(errorCode)
}

const CFB_MIME_TYPE = 'application/x-cfb'

const isAllowedFileType = ({ s3Location, filename }) => {
  const detected = s3Location?.detectedContentType
  if (detected === CFB_MIME_TYPE) {
    return /\.doc$/i.test(filename ?? '')
  }
  return DOCUMENT_ALLOWED_MIME_TYPES.includes(detected)
}

const failUpload = async ({ request, h, uploadPageUrl }, message) => {
  await setMarinePlanPolicySupportingDocumentUploadSession(request, h, {
    uploadError: { message, fieldName: 'file' }
  })
  return h.redirect(uploadPageUrl)
}

const saveDocument = async (status, context) => {
  const { request, h, noUploadUrl, persistDocument, buildReturnUrl } = context

  if (!isAllowedFileType(status)) {
    return failUpload(context, DOCUMENT_FILE_TYPE_ERROR_MESSAGE)
  }

  try {
    const documentId = await persistDocument(status)
    await setMarinePlanPolicySupportingDocumentUploadSession(request, h, {})
    return h.redirect(buildReturnUrl(documentId))
  } catch (error) {
    if (error.output?.statusCode === statusCodes.unsupportedMediaType) {
      return failUpload(context, DOCUMENT_FILE_TYPE_ERROR_MESSAGE)
    }
    if (error.output?.statusCode === statusCodes.notFound) {
      request.logger.warn(
        { err: error },
        'Marine plan policy supporting document upload: Nothing to save the document against'
      )
      await setMarinePlanPolicySupportingDocumentUploadSession(request, h, {})
      return h.redirect(noUploadUrl)
    }
    throw error
  }
}

const processUploadStatus = (status, context) => {
  const { request, h, uploadPageUrl, marineLicence, noUploadUrl } = context

  if (PROCESSING_STATUSES.has(status.status)) {
    return h.view(UPLOAD_AND_WAIT_VIEW_ROUTE, {
      ...uploadAndWaitPageSettings,
      projectName: marineLicence.projectName,
      isProcessing: true,
      filename: status.filename,
      tryAgainLink: uploadPageUrl,
      cancelLink: noUploadUrl
    })
  }

  if (status.status === 'ready') {
    return saveDocument(status, context)
  }

  if (FAILED_STATUSES.has(status.status)) {
    request.logger.error(
      { error: { code: status.errorCode, message: status.message } },
      'Marine plan policy supporting document upload: CDP rejection error'
    )
    return failUpload(context, rejectionMessage(status.errorCode))
  }

  request.logger.warn(
    { tenant: { message: `status: ${status.status}` } },
    'Marine plan policy supporting document upload: Unknown upload status'
  )
  return h.redirect(uploadPageUrl)
}

export const handleSupportingDocumentUploadStatus = async (
  request,
  h,
  { persistDocument, buildReturnUrl, noUploadUrl, marineLicence }
) => {
  const { uploadId, statusUrl, uploadPageUrl } =
    getMarinePlanPolicySupportingDocumentUploadSession(request)

  if (!uploadId) {
    return h.redirect(noUploadUrl)
  }

  try {
    const status = await getCdpUploadService().getStatus(uploadId, statusUrl)
    return await processUploadStatus(status, {
      request,
      h,
      uploadPageUrl,
      marineLicence,
      persistDocument,
      buildReturnUrl,
      noUploadUrl
    })
  } catch (error) {
    request.logger.error(
      { err: error },
      'Marine plan policy supporting document upload: Failed to check upload status'
    )
    await setMarinePlanPolicySupportingDocumentUploadSession(request, h, {})
    return h.redirect(uploadPageUrl)
  }
}
