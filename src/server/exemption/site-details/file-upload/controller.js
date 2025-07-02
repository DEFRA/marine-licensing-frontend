import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { getCdpUploadService } from '~/src/services/cdp-upload-service/index.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { config } from '~/src/config/config.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'

export const FILE_UPLOAD_VIEW_ROUTE = 'exemption/site-details/file-upload/index'

// MIME types for different file types - inclusive approach for cross-platform compatibility
const MIME_TYPES = {
  kml: [
    'application/vnd.google-earth.kml+xml',
    'application/kml+xml',
    'text/xml', // Some systems detect KML as generic XML
    'application/xml'
  ],
  shapefile: [
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream' // Some systems detect ZIP as binary
  ]
}

const pageSettings = {
  pageTitle: 'Upload a file',
  heading: 'Upload a file'
}

/**
 * Get appropriate MIME types based on selected file type
 * @param {string} fileUploadType - 'kml' or 'shapefile'
 * @returns {string[]} Array of MIME types
 */
const getMimeTypesForFileType = (fileUploadType) => {
  return MIME_TYPES[fileUploadType] || []
}

/**
 * Get file type specific page content
 * @param {string} fileUploadType - 'kml' or 'shapefile'
 * @returns {object} Page content configuration
 */
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
  }
  return {
    heading: 'Upload a file',
    acceptAttribute: ''
  }
}

/**
 * Create error summary and field errors for display
 * @param {string} message - Error message
 * @param {string} fieldName - Field name for error
 * @returns {object} Error summary and field errors
 */
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
/**
 * A GDS styled file upload page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const fileUploadController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { fileUploadType, uploadedFile, uploadError } =
      exemption.siteDetails || {}

    if (!fileUploadType) {
      // Redirect back to file type selection if no type chosen
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
      updateExemptionSiteDetails(request, 'uploadError', undefined)

      request.logger.debug('Displaying upload error from session', {
        message: uploadError.message,
        fieldName: uploadError.fieldName,
        fileType: uploadError.fileType
      })
    }

    if (uploadedFile && !uploadError) {
      request.logger.debug(
        'Uploaded file without error found, but starting a new upload session'
      )
      // We may want to consider adding in some error handling as we have a valid file at this point.
    }

    try {
      // Initialize CDP upload session (always needed for upload form)
      const mimeTypes = getMimeTypesForFileType(fileUploadType)
      const cdpService = getCdpUploadService(mimeTypes)
      const cdpUploadConfig = config.get('cdpUploader')
      const s3Bucket = cdpUploadConfig.s3Bucket
      const redirectUrl = `${config.get('appBaseUrl')}${routes.UPLOAD_AND_WAIT}`
      const uploadConfig = await cdpService.initiate({
        redirectUrl,
        s3Path: s3PathForExemptions,
        s3Bucket
      })

      // Store upload configuration in session
      updateExemptionSiteDetails(request, 'uploadConfig', {
        uploadId: uploadConfig.uploadId,
        statusUrl: uploadConfig.statusUrl,
        fileType: fileUploadType
      })
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
        errors,
        showUploadForm: true
      })
    } catch (error) {
      request.logger.error('Failed to initialize file upload', {
        error: error.message,
        exemptionId: exemption.id,
        fileUploadType
      })

      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }
  }
}

/**
 * A GDS styled file upload POST controller for handling successful uploads.
 * @satisfies {Partial<ServerRoute>}
 */
export const fileUploadSubmitController = {
  handler(request, h) {
    // AC5: Continue to next step in flow after successful upload
    // For now, redirect to task list as per AC requirements
    // This will be updated when next page in flow is implemented
    return h.redirect(routes.TASK_LIST)
  }
}
