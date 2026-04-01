import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { routes } from '#src/server/common/constants/routes.js'
import { config } from '#src/config/config.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import {
  getFileTypeContent,
  createFileUploadErrorDisplay
} from '#src/server/common/helpers/file-upload/file-upload.js'
import {
  fileUploadPageSettings,
  FILE_UPLOAD_VIEW_ROUTE
} from '#src/server/common/helpers/file-upload/constants.js'

const s3PathForExemptions = 'exemptions'
export const fileUploadController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const site = getSiteDetailsBySite(exemption)

    const { fileUploadType, uploadedFile, uploadError } = site

    request.logger.debug(
      `fileUploadController: fileUploadType [${fileUploadType}]`
    )

    if (!fileUploadType) {
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }

    const fileTypeContent = getFileTypeContent(fileUploadType)

    // Check for error state from previous upload attempt
    let errorSummary, errors
    if (uploadError) {
      const errorDisplay = createFileUploadErrorDisplay(uploadError, request)
      errorSummary = errorDisplay.errorSummary
      errors = errorDisplay.errors

      // Clear error from session after retrieving
      await updateExemptionSiteDetails(request, h, 0, 'uploadError', null)
    }

    if (uploadedFile && !uploadError) {
      request.logger.debug(
        'Uploaded file without error found, but starting a new upload session'
      )
    }

    try {
      const cdpService = getCdpUploadService()
      const cdpUploadConfig = config.get('cdpUploader')
      const s3Bucket = cdpUploadConfig.s3Bucket
      const redirectUrl = routes.UPLOAD_AND_WAIT
      const uploadConfig = await cdpService.initiate({
        redirectUrl,
        s3Path: s3PathForExemptions,
        s3Bucket
      })

      // Store upload configuration in session
      await updateExemptionSiteDetails(request, h, 0, 'uploadConfig', {
        uploadId: uploadConfig.uploadId,
        statusUrl: uploadConfig.statusUrl,
        fileType: fileUploadType
      })

      // Show the upload form
      return h.view(FILE_UPLOAD_VIEW_ROUTE, {
        ...fileUploadPageSettings,
        ...fileTypeContent,
        projectName: exemption.projectName,
        uploadUrl: uploadConfig.uploadUrl,
        maxFileSize: uploadConfig.maxFileSize,
        acceptAttribute: fileTypeContent.acceptAttribute,
        fileUploadType,
        backLink: routes.CHOOSE_FILE_UPLOAD_TYPE,
        cancelLink: `${routes.TASK_LIST}?cancel=site-details`,
        errorSummary,
        errors
      })
    } catch (error) {
      request.logger.error(
        {
          err: error,
          exemptionId: exemption.id,
          fileUploadType
        },
        'Failed to initialize file upload'
      )

      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }
  }
}
