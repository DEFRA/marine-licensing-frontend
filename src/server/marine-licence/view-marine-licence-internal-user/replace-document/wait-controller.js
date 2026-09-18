import { config } from '#src/config/config.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getCdpErrorMessageFromCode } from '#src/server/common/helpers/file-upload/file-upload.js'
import { handleReadyStatus } from '#src/server/common/helpers/file-upload/upload-status-handler.js'
import { DEFAULT_ERROR_MESSAGE } from '#src/server/common/helpers/file-upload/error-messages.js'
import {
  UPLOAD_AND_WAIT_VIEW_ROUTE,
  uploadAndWaitPageSettings
} from '#src/server/common/helpers/file-upload/constants.js'
import {
  clearRedactionUpload,
  getRedactionUpload,
  setRedactionUpload
} from '#src/server/common/helpers/marine-licence/session-cache/redaction-upload.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { replaceDocumentUrls } from '#src/server/marine-licence/view-marine-licence-internal-user/replace-document/urls.js'

const storeUploadError = (request, h, message) =>
  setRedactionUpload(request, h, {
    uploadError: { message, fieldName: 'file' }
  })

/**
 * Records the replacement against the redaction. The applicant's submitted
 * record is deliberately left untouched.
 */
const saveReplacedDocument = async (
  request,
  { marineLicence, fieldKey, status }
) => {
  const { siteIndex, drawingIndex } = getSiteDataFromParam(request.query)

  await getMarineLicenceService(request).saveRedaction(
    marineLicence.id,
    fieldKey,
    undefined,
    {
      ...(request.query.site && { siteIndex, drawingIndex }),
      withhold: true,
      filename: status.filename,
      s3Location: {
        s3Bucket: config.get('cdpUploader').s3Bucket,
        s3Key: status.s3Location?.s3Key,
        checksumSha256: status.s3Location?.checksumSha256
      }
    }
  )
}

const isAllowedFileType = (status, allowedMimeTypes) => {
  const detected = status.s3Location?.detectedContentType
  return !detected || allowedMimeTypes.includes(detected)
}

const handleReady = async (status, context) => {
  const { request, h, urls, upload, documentConfig, marineLicence } = context
  const { fileType, allowedMimeTypes, fileTypeErrorMessage, fieldKey } =
    documentConfig

  if (fileType) {
    const redirect = await handleReadyStatus(
      status,
      { ...upload, fileType },
      request,
      h,
      {
        storeUploadError: (req, hh, errorDetails) =>
          storeUploadError(req, hh, errorDetails.message),
        fileUploadRoute: urls.uploadUrl
      }
    )

    if (redirect) {
      return redirect
    }
  }

  if (!isAllowedFileType(status, allowedMimeTypes)) {
    await storeUploadError(request, h, fileTypeErrorMessage)

    return h.redirect(urls.uploadUrl)
  }

  await saveReplacedDocument(request, { marineLicence, fieldKey, status })
  await clearRedactionUpload(request, h)

  return h.redirect(urls.returnUrl)
}

const handleRejected = async (status, context) => {
  const { request, h, urls, documentConfig } = context

  const message = status.errorCode
    ? getCdpErrorMessageFromCode(status.errorCode, documentConfig.fileType)
    : DEFAULT_ERROR_MESSAGE

  request.logger.error(
    { error: { code: status.errorCode, message: status.message } },
    'ReplaceDocument: CDP rejection error'
  )

  await storeUploadError(request, h, message)

  return h.redirect(urls.uploadUrl)
}

const processStatus = async (status, context) => {
  const { request, h, urls, marineLicence } = context

  if (status.status === 'pending' || status.status === 'scanning') {
    return h.view(UPLOAD_AND_WAIT_VIEW_ROUTE, {
      ...uploadAndWaitPageSettings,
      projectName: marineLicence.projectName,
      isProcessing: true,
      filename: status.filename,
      tryAgainLink: urls.uploadUrl,
      cancelLink: urls.returnUrl
    })
  }

  if (status.status === 'ready') {
    return handleReady(status, context)
  }

  if (status.status === 'rejected' || status.status === 'error') {
    return handleRejected(status, context)
  }

  request.logger.warn(
    { status: status.status },
    'ReplaceDocument: Unknown upload status'
  )

  return h.redirect(urls.returnUrl)
}

export const createReplaceWaitController = (documentConfig) => ({
  async handler(request, h) {
    const { applicationReference } = request.params
    const urls = replaceDocumentUrls(
      applicationReference,
      documentConfig.documentType,
      request.query
    )

    const upload = getRedactionUpload(request)

    if (!upload.uploadId) {
      return h.redirect(urls.returnUrl)
    }

    try {
      const marineLicence =
        await getMarineLicenceService(request).getMarineLicenceByReference(
          applicationReference
        )

      const status = await getCdpUploadService().getStatus(
        upload.uploadId,
        upload.statusUrl
      )

      return await processStatus(status, {
        request,
        h,
        urls,
        upload,
        documentConfig,
        marineLicence
      })
    } catch (error) {
      request.logger.error(
        { err: error, uploadId: upload.uploadId },
        'ReplaceDocument: Failed to check upload status'
      )

      await clearRedactionUpload(request, h)

      return h.redirect(urls.returnUrl)
    }
  }
})
