import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { getCdpUploadService } from '~/src/services/cdp-upload-service/index.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { config } from '~/src/config/config.js'

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
 * A GDS styled file upload page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const fileUploadController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { fileUploadType, uploadedFile } = exemption.siteDetails || {}

    if (!fileUploadType) {
      // Redirect back to file type selection if no type chosen
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }

    const fileTypeContent = getFileTypeContent(fileUploadType)

    // AC5: If file already uploaded, show success state with continue option
    if (uploadedFile) {
      return h.view(FILE_UPLOAD_VIEW_ROUTE, {
        ...pageSettings,
        ...fileTypeContent,
        projectName: exemption.projectName,
        uploadedFile,
        fileUploadType,
        backLink: routes.CHOOSE_FILE_UPLOAD_TYPE,
        cancelLink: `${routes.TASK_LIST}?cancel=site-details`,
        csrfToken: request.server.plugins.crumb.generate(request, h)
      })
    }

    try {
      // Initialize CDP upload session
      const mimeTypes = getMimeTypesForFileType(fileUploadType)
      const cdpService = getCdpUploadService(mimeTypes)
      const cdpUploadConfig = config.get('cdpUploader')
      const s3Bucket = cdpUploadConfig.s3Bucket
      const redirectUrl = `${config.get('appBaseUrl')}${routes.UPLOAD_COMPLETE}`
      const uploadConfig = await cdpService.initiate({
        redirectUrl,
        s3Path: 'exemptions',
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
        cancelLink: `${routes.TASK_LIST}?cancel=site-details`
      })
    } catch (error) {
      request.logger.error('Failed to initialize file upload', {
        error: error.message,
        exemptionId: exemption.id,
        fileUploadType
      })

      // Return to file type selection with error
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
