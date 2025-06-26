import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { getCdpUploadService } from '~/src/services/cdp-upload-service/index.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'

export const UPLOAD_COMPLETE_VIEW_ROUTE =
  'exemption/site-details/upload-complete/index'

const pageSettings = {
  pageTitle: 'File upload status',
  heading: 'Your file is currently being checked for viruses'
}

/**
 * Transform CDP error message to validation error format
 * @param {string} message - CDP error message
 * @param {string} fileType - File type for contextualized errors
 * @returns {object} Validation error object
 */
const transformCdpErrorToValidationError = (message, fileType) => {
  const errorKey = 'file-upload'

  // Map CDP error messages to AC4 requirements
  let errorMessage = message

  if (message.includes('virus')) {
    errorMessage = 'The selected file contains a virus'
  } else if (message.includes('empty')) {
    errorMessage = 'The selected file is empty'
  } else if (message.includes('smaller than')) {
    errorMessage = 'The selected file must be smaller than 50 MB'
  } else if (message.includes('password protected')) {
    errorMessage = 'The selected file is password protected'
  } else if (message.includes('must be a')) {
    // Contextualize file type error based on selected type
    if (fileType === 'kml') {
      errorMessage = 'The selected file must be a KML file'
    } else if (fileType === 'shapefile') {
      errorMessage = 'The selected file must be a Shapefile'
    } else {
      errorMessage = 'The selected file is not the correct type'
    }
  } else {
    // Generic upload error
    errorMessage = 'The selected file could not be uploaded – try again'
  }

  const errorDetail = {
    path: [errorKey],
    message: errorMessage,
    type: 'upload.error'
  }

  const errorSummary = mapErrorsForDisplay([errorDetail], {
    [errorMessage]: errorMessage
  })

  const errors = errorDescriptionByFieldName(errorSummary)

  return { errorSummary, errors }
}

/**
 * A GDS styled upload complete page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const uploadCompleteController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { uploadConfig } = exemption.siteDetails || {}

    if (!uploadConfig) {
      // No upload session, redirect back to file type selection
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }

    try {
      // Check upload status
      const cdpService = getCdpUploadService()
      const status = await cdpService.getStatus(
        uploadConfig.uploadId,
        uploadConfig.statusUrl
      )

      request.logger.debug('Upload status check', {
        uploadId: uploadConfig.uploadId,
        status: status.status,
        filename: status.filename
      })

      if (status.status === 'pending' || status.status === 'scanning') {
        // Still processing - show waiting page with meta refresh
        return h.view(UPLOAD_COMPLETE_VIEW_ROUTE, {
          ...pageSettings,
          projectName: exemption.projectName,
          isProcessing: true,
          filename: status.filename
        })
      }

      if (status.status === 'ready') {
        // File upload successful - store file details in session
        updateExemptionSiteDetails(request, 'uploadedFile', {
          filename: status.filename,
          fileSize: status.fileSize,
          uploadedAt: status.uploadedAt,
          s3Key: uploadConfig.uploadId, // Use uploadId as reference
          fileType: uploadConfig.fileType
        })

        // Clear upload config from session
        updateExemptionSiteDetails(request, 'uploadConfig', undefined)

        // AC5: Return to upload page to show success (per story requirements)
        return h.redirect(routes.FILE_UPLOAD)
      }

      if (status.status === 'rejected' || status.status === 'error') {
        // File rejected or error - show upload page with error
        const { errorSummary, errors } = transformCdpErrorToValidationError(
          status.message ?? 'Upload failed',
          uploadConfig.fileType
        )

        // Clear upload config from session
        updateExemptionSiteDetails(request, 'uploadConfig', undefined)

        // Get file type content for re-rendering upload page
        const fileTypeContent =
          uploadConfig.fileType === 'kml'
            ? { heading: 'Upload a KML file', acceptAttribute: '.kml' }
            : { heading: 'Upload a Shapefile', acceptAttribute: '.zip' }

        return h.view('exemption/site-details/file-upload/index', {
          pageTitle: 'Upload a file',
          ...fileTypeContent,
          projectName: exemption.projectName,
          fileUploadType: uploadConfig.fileType,
          backLink: routes.CHOOSE_FILE_UPLOAD_TYPE,
          cancelLink: `${routes.TASK_LIST}?cancel=site-details`,
          errorSummary,
          errors,
          showUploadForm: true // Flag to re-initialize upload form
        })
      }

      // Unknown status - redirect to file type selection
      request.logger.warn('Unknown upload status', {
        uploadId: uploadConfig.uploadId,
        status: status.status
      })

      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    } catch (error) {
      request.logger.error('Failed to check upload status', {
        error: error.message,
        uploadId: uploadConfig.uploadId
      })

      // Clear upload config and redirect to file type selection
      updateExemptionSiteDetails(request, 'uploadConfig', undefined)
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }
  }
}
