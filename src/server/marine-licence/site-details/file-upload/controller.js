import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { config } from '#src/config/config.js'
import {
  getFileTypeContent,
  createFileUploadErrorDisplay
} from '#src/server/common/helpers/file-upload/file-upload.js'
import {
  fileUploadPageSettings,
  FILE_UPLOAD_VIEW_ROUTE
} from '#src/server/common/helpers/file-upload/constants.js'
import {
  getMarineLicenceCache,
  getSingleSiteMode,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'

const s3PathForMarineLicence = 'marine-licence'

export const fileUploadController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const site = getSiteDetailsBySite(marineLicence)

    const { fileUploadType, uploadedFile, uploadError } = site

    request.logger.debug(
      `fileUploadController: fileUploadType [${fileUploadType}]`
    )

    if (!fileUploadType) {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
      )
    }

    const fileTypeContent = getFileTypeContent(fileUploadType)

    // Check for error state from previous upload attempt
    let errorSummary, errors
    if (uploadError) {
      const errorDisplay = createFileUploadErrorDisplay(uploadError, request)
      errorSummary = errorDisplay.errorSummary
      errors = errorDisplay.errors

      // Clear error from session after retrieving
      await updateMarineLicenceSiteDetails(request, h, 0, 'uploadError', null)
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
      const redirectUrl = marineLicenceRoutes.MARINE_LICENCE_UPLOAD_AND_WAIT
      const uploadConfig = await cdpService.initiate({
        redirectUrl,
        s3Path: s3PathForMarineLicence,
        s3Bucket
      })

      // Store upload configuration in session
      await updateMarineLicenceSiteDetails(request, h, 0, 'uploadConfig', {
        uploadId: uploadConfig.uploadId,
        statusUrl: uploadConfig.statusUrl,
        fileType: fileUploadType
      })

      const singleSiteMode = getSingleSiteMode(request)
      const cancelLink = singleSiteMode
        ? marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
        : `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

      // Show the upload form
      return h.view(FILE_UPLOAD_VIEW_ROUTE, {
        ...fileUploadPageSettings,
        ...fileTypeContent,
        projectName: marineLicence.projectName,
        uploadUrl: uploadConfig.uploadUrl,
        maxFileSize: uploadConfig.maxFileSize,
        acceptAttribute: fileTypeContent.acceptAttribute,
        fileUploadType,
        backLink: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE,
        cancelLink,
        errorSummary,
        errors,
        singleSiteMode
      })
    } catch (error) {
      request.logger.error(
        {
          err: error,
          marineLicenceId: marineLicence.id,
          fileUploadType
        },
        'Failed to initialize file upload'
      )

      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
      )
    }
  }
}
