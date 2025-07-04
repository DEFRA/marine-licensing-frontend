import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { getCdpUploadService } from '~/src/services/cdp-upload-service/index.js'
import { routes } from '~/src/server/common/constants/routes.js'

export const UPLOAD_AND_WAIT_VIEW_ROUTE =
  'exemption/site-details/upload-and-wait/index'

const pageSettings = {
  pageTitle: 'Checking your file...',
  heading: 'Checking your file...',
  pageRefreshTimeInSeconds: 2
}

/**
 * Transform CDP error message to validation error format
 * @param {string} message - CDP error message
 * @param {string} fileType - File type for contextualized errors
 * @returns {object} Validation error object with message and fieldName
 */
const transformCdpErrorToValidationError = (message, fileType) => {
  const errorKey = 'file'

  // Map CDP error messages to AC4 requirements
  let errorMessage

  if (message.includes('Select a file to upload')) {
    errorMessage = 'Select a file to upload'
  } else if (message.includes('virus')) {
    errorMessage = 'The selected file contains a virus'
  } else if (message.includes('empty')) {
    errorMessage = 'The selected file is empty'
  } else if (message.includes('smaller than')) {
    errorMessage = 'The selected file must be smaller than 50 MB'
  } else if (message.includes('must be a')) {
    // Contextualize file type error based on selected type
    if (fileType === 'kml') {
      errorMessage = 'The selected file must be a KML file'
    } else if (fileType === 'shapefile') {
      errorMessage = 'The selected file must be a Shapefile'
    } else {
      // There isn't a generic wrong file type error. Use the generic one.
      errorMessage = 'The selected file could not be uploaded – try again'
    }
  } else {
    // Generic upload error
    errorMessage = 'The selected file could not be uploaded – try again'
  }

  return {
    message: errorMessage,
    fieldName: errorKey
  }
}

/**
 * A GDS styled upload complete page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const uploadAndWaitController = {
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

      request.logger.debug(
        `Upload status check:  ${JSON.stringify(
          {
            uploadId: uploadConfig.uploadId,
            status: status.status,
            filename: status.filename
          },
          null,
          2
        )}`
      )

      if (status.status === 'pending' || status.status === 'scanning') {
        // Still processing - show waiting page with meta refresh
        return h.view(UPLOAD_AND_WAIT_VIEW_ROUTE, {
          ...pageSettings,
          projectName: exemption.projectName,
          isProcessing: true,
          filename: status.filename
        })
      }

      if (status.status === 'ready') {
        // File upload successful - store file details in session
        updateExemptionSiteDetails(request, 'uploadedFile', status)

        // Clear upload config from session
        updateExemptionSiteDetails(request, 'uploadConfig', undefined)

        // Change this to next page when built
        return h.redirect(routes.FILE_UPLOAD)
      }

      if (status.status === 'rejected' || status.status === 'error') {
        // File rejected or error - store error details in session and redirect
        const errorDetails = transformCdpErrorToValidationError(
          status.message,
          uploadConfig.fileType
        )

        // Store error details in session for file-upload controller to handle
        updateExemptionSiteDetails(request, 'uploadError', {
          message: errorDetails.message,
          fieldName: errorDetails.fieldName,
          fileType: uploadConfig.fileType
        })

        // Clear upload config from session
        updateExemptionSiteDetails(request, 'uploadConfig', undefined)

        // Redirect to file-upload route to handle error display and new session creation
        return h.redirect(routes.FILE_UPLOAD)
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
