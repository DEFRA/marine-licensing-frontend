import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { config } from '#src/config/config.js'
import { createFileUploadErrorDisplay } from '#src/server/common/helpers/file-upload/file-upload.js'
import { fileUploadPageSettings } from '#src/server/common/helpers/file-upload/constants.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { updateWaterFrameworkDirective } from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import {
  s3PathForWaterFrameworkDirective,
  WFD_ACCEPT_ATTRIBUTE
} from '#src/server/common/constants/water-framework-directive.js'
import { getBackLink } from '#src/server/marine-licence/water-framework-directive/file-upload/utils.js'

export const WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD_VIEW_ROUTE =
  'marine-licence/water-framework-directive/file-upload/index'

const PAGE_HEADING = 'Upload your Water Framework Directive assessment'

const waterFrameworkDirectiveUploadAndWaitPageSettings = {
  ...fileUploadPageSettings,
  pageTitle: PAGE_HEADING,
  heading: PAGE_HEADING
}

export const waterFrameworkFileUploadController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { waterFrameworkDirective = {} } = marineLicence
    const { uploadedFile, uploadError } = waterFrameworkDirective

    let errorSummary, errors
    if (uploadError) {
      const errorDisplay = createFileUploadErrorDisplay(uploadError, request)
      errorSummary = errorDisplay.errorSummary
      errors = errorDisplay.errors

      await updateWaterFrameworkDirective(request, h, 'uploadError', null)
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

      const redirectUrl =
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_UPLOAD_AND_WAIT

      const uploadConfig = await cdpService.initiate({
        redirectUrl,
        s3Path: s3PathForWaterFrameworkDirective,
        s3Bucket
      })

      await updateWaterFrameworkDirective(request, h, 'uploadConfig', {
        uploadId: uploadConfig.uploadId,
        statusUrl: uploadConfig.statusUrl
      })

      return h.view(WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD_VIEW_ROUTE, {
        ...waterFrameworkDirectiveUploadAndWaitPageSettings,
        projectName: marineLicence.projectName,
        uploadUrl: uploadConfig.uploadUrl,
        maxFileSize: uploadConfig.maxFileSize,
        acceptAttribute: WFD_ACCEPT_ATTRIBUTE,
        backLink: getBackLink(waterFrameworkDirective.previousAssessment),
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        errorSummary,
        errors
      })
    } catch (error) {
      request.logger.error(
        {
          err: error
        },
        'Failed to initialize WFD file upload'
      )

      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }
  }
}
