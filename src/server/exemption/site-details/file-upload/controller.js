import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { routes } from '#src/server/common/constants/routes.js'
import { config } from '#src/config/config.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
export const FILE_UPLOAD_VIEW_ROUTE = 'exemption/site-details/file-upload/index'

const UPLOAD_A_FILE = 'Upload a file'
const pageSettings = {
  pageTitle: UPLOAD_A_FILE,
  heading: UPLOAD_A_FILE
}
const getFileTypeContent = (fileUploadType) => {
  if (fileUploadType === 'kml') {
    return {
      heading: 'Upload a KML file',
      acceptAttribute: '.kml'
    }
  } else if (fileUploadType === 'shapefile') {
    return {
      heading: 'Upload a Shapefile',
      acceptAttribute: '.zip'
    }
  } else {
    return {
      heading: UPLOAD_A_FILE,
      acceptAttribute: ''
    }
  }
}
const createErrorDisplay = (message, fieldName) => {
  const errorDetail = {
    path: [fieldName], // Must be array to match Joi validation format
    message,
    type: 'upload.error'
  }

  const errorSummary = mapErrorsForDisplay([errorDetail], {
    [message]: message
  })

  const errors = errorDescriptionByFieldName(errorSummary)

  return { errorSummary, errors }
}

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
      const errorDisplay = createErrorDisplay(
        uploadError.message,
        uploadError.fieldName
      )
      errorSummary = errorDisplay.errorSummary
      errors = errorDisplay.errors

      // Clear error from session after retrieving
      await updateExemptionSiteDetails(request, h, 0, 'uploadError', null)

      request.logger.debug(
        {
          message: uploadError.message,
          fieldName: uploadError.fieldName,
          fileType: uploadError.fileType
        },
        'Displaying upload error from session'
      )
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
        ...pageSettings,
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
          error: error.message,
          exemptionId: exemption.id,
          fileUploadType
        },
        'Failed to initialize file upload'
      )

      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }
  }
}
