import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { updateWaterFrameworkDirective } from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { getCdpErrorMessageFromCode } from '#src/server/common/helpers/file-upload/file-upload.js'
import { DEFAULT_ERROR_MESSAGE } from '#src/server/common/helpers/file-upload/error-messages.js'
import {
  UPLOAD_AND_WAIT_VIEW_ROUTE,
  uploadAndWaitPageSettings
} from '#src/server/common/helpers/file-upload/constants.js'
import { saveWaterFrameworkDirectiveToBackend } from '#src/server/common/helpers/marine-licence/water-framework-directive/save-water-framework-directive.js'

const fileUploadRoute =
  marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD

const storeUploadError = async (request, h, errorDetails) => {
  await updateWaterFrameworkDirective(request, h, 'uploadError', {
    message: errorDetails.message,
    fieldName: errorDetails.fieldName
  })
  await updateWaterFrameworkDirective(request, h, 'uploadConfig', null)
}

const handleProcessingStatus = (status, marineLicence, h) => {
  return h.view(UPLOAD_AND_WAIT_VIEW_ROUTE, {
    ...uploadAndWaitPageSettings,
    projectName: marineLicence.projectName,
    isProcessing: true,
    filename: status.filename,
    tryAgainLink: fileUploadRoute,
    cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
  })
}

const handleReadyStatus = async (status, request, h) => {
  await updateWaterFrameworkDirective(request, h, 'uploadedFile', {
    filename: status.filename,
    contentType: status.contentType,
    fileId: status.s3Location?.fileId,
    s3Key: status.s3Location?.s3Key
  })
  await updateWaterFrameworkDirective(request, h, 'uploadConfig', null)

  await saveWaterFrameworkDirectiveToBackend(request)

  return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
}

const handleRejectedStatus = async (status, request, h) => {
  const errorMessage = status.errorCode
    ? getCdpErrorMessageFromCode(status.errorCode)
    : DEFAULT_ERROR_MESSAGE

  request.logger.error(
    { error: { code: status.errorCode, message: status.message } },
    'WFD FileUpload: CDP rejection error'
  )

  await storeUploadError(request, h, {
    message: errorMessage,
    fieldName: 'file'
  })

  return h.redirect(fileUploadRoute)
}

const processUploadStatus = async (status, context) => {
  const { uploadConfig, request, h, marineLicence } = context

  request.logger.debug(
    `WFD upload status check: ${JSON.stringify({ uploadId: uploadConfig.uploadId, status: status.status, filename: status.filename }, null, 2)}`
  )

  if (status.status === 'pending' || status.status === 'scanning') {
    return handleProcessingStatus(status, marineLicence, h)
  }

  if (status.status === 'ready') {
    return handleReadyStatus(status, request, h)
  }

  if (status.status === 'rejected' || status.status === 'error') {
    return handleRejectedStatus(status, request, h)
  }

  request.logger.warn(
    { uploadId: uploadConfig.uploadId, status: status.status },
    'WFD FileUpload: Unknown upload status'
  )

  return h.redirect(fileUploadRoute)
}

export const waterFrameworkDirectiveUploadAndWaitController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { waterFrameworkDirective = {} } = marineLicence
    const { uploadConfig } = waterFrameworkDirective

    if (!uploadConfig) {
      return h.redirect(fileUploadRoute)
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
        'WFD FileUpload: Failed to check upload status'
      )

      await updateWaterFrameworkDirective(request, h, 'uploadConfig', null)

      return h.redirect(fileUploadRoute)
    }
  }
}
