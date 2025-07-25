import {
  getExemptionCache,
  updateExemptionSiteDetails,
  updateExemptionSiteDetailsBatch
} from '~/src/server/common/helpers/session-cache/utils.js'
import { getCdpUploadService } from '~/src/services/cdp-upload-service/index.js'
import { getFileValidationService } from '~/src/services/file-validation/index.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { authenticatedPostRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { config } from '~/src/config/config.js'
import { extractCoordinatesFromGeoJSON } from '~/src/server/common/helpers/coordinate-utils.js'

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
 * Gets allowed extensions for file type
 * @param {string} fileType - The file type ('kml' or 'shapefile')
 * @returns {string[]} Allowed extensions
 */
function getAllowedExtensions(fileType) {
  switch (fileType) {
    case 'kml':
      return ['kml']
    case 'shapefile':
      return ['zip']
    default:
      return []
  }
}

/**
 * Extract coordinates from uploaded file using geo-parser API
 * @param {Request} request - Hapi request object
 * @param {string} s3Bucket - S3 bucket name
 * @param {string} s3Key - S3 object key
 * @param {string} fileType - File type ('kml' or 'shapefile')
 * @returns {Promise<object>} Extracted coordinates and GeoJSON
 */
async function extractCoordinatesFromFile(request, s3Bucket, s3Key, fileType) {
  try {
    request.logger.info('Calling geo-parser API', { s3Bucket, s3Key, fileType })

    const response = await authenticatedPostRequest(
      request,
      '/geo-parser/extract',
      {
        s3Bucket,
        s3Key,
        fileType
      }
    )

    const { payload } = response
    if (!payload || payload.message !== 'success') {
      throw new Error('Invalid geo-parser response')
    }

    const geoJSON = payload.value
    if (!geoJSON?.features) {
      throw new Error('Invalid GeoJSON structure')
    }

    const extractedCoordinates = extractCoordinatesFromGeoJSON(geoJSON)

    request.logger.info('Successfully extracted coordinates', {
      featureCount: geoJSON.features.length,
      coordinateCount: extractedCoordinates.length
    })

    return {
      geoJSON,
      extractedCoordinates,
      featureCount: geoJSON.features.length
    }
  } catch (error) {
    request.logger.error('Failed to extract coordinates from file', {
      error: error.message,
      s3Bucket,
      s3Key,
      fileType
    })
    throw error
  }
}

/**
 * Handle file validation errors
 * @param {object} request - Hapi request object
 * @param {object} validation - Validation result object
 * @param {string} fileType - File type for contextualized errors
 * @returns {object} Error details for redirection
 */
function handleValidationError(request, validation, fileType) {
  const errorDetails = transformCdpErrorToValidationError(
    validation.errorMessage,
    fileType
  )
  storeUploadError(request, errorDetails, fileType)
  return { redirect: routes.FILE_UPLOAD }
}

/**
 * Handle geo-parser processing errors
 * @param {object} request - Hapi request object
 * @param {Error} error - The caught error
 * @param {string} filename - Upload filename for logging
 * @param {string} fileType - File type for contextualized errors
 * @returns {object} Error details for redirection
 */
function handleGeoParserError(request, error, filename, fileType) {
  const errorDetails = {
    message: 'The selected file could not be processed – try again',
    fieldName: 'file',
    fileType
  }

  storeUploadError(request, errorDetails, fileType)

  request.logger.error('Failed to extract coordinates from uploaded file', {
    error: error.message,
    filename,
    fileType
  })

  return { redirect: routes.FILE_UPLOAD }
}

/**
 * Handle CDP rejection or error statuses
 * @param {object} request - Hapi request object
 * @param {object} status - Upload status response from CDP
 * @param {string} fileType - File type for contextualized errors
 * @returns {object} Error details for redirection
 */
function handleCdpRejectionError(request, status, fileType) {
  const errorDetails = transformCdpErrorToValidationError(
    status.message,
    fileType
  )
  storeUploadError(request, errorDetails, fileType)
  return { redirect: routes.FILE_UPLOAD }
}

/**
 * Clear upload configuration from session
 * @param {object} request - Hapi request object
 */
function clearUploadSession(request) {
  updateExemptionSiteDetails(request, 'uploadConfig', null)
}

/**
 * Store upload error details in session and clear upload config
 * @param {object} request - Hapi request object
 * @param {object} errorDetails - Error details with message and fieldName
 * @param {string} fileType - File type for contextualized errors
 */
function storeUploadError(request, errorDetails, fileType) {
  updateExemptionSiteDetails(request, 'uploadError', {
    message: errorDetails.message,
    fieldName: errorDetails.fieldName,
    fileType
  })
  clearUploadSession(request)
}

/**
 * Store successful upload data and coordinate extraction results in session
 * @param {object} request - Hapi request object
 * @param {object} status - Upload status response from CDP
 * @param {object} coordinateData - Extracted coordinate data
 * @param {string} s3Bucket - S3 bucket name
 * @param {string} s3Key - S3 object key
 */
function storeSuccessfulUpload(
  request,
  status,
  coordinateData,
  s3Bucket,
  s3Key
) {
  updateExemptionSiteDetailsBatch(request, {
    uploadedFile: {
      ...status,
      s3Location: {
        s3Bucket,
        s3Key,
        fileId: status.s3Location.fileId,
        s3Url: status.s3Location.s3Url,
        checksumSha256: status.s3Location.checksumSha256
      }
    },
    extractedCoordinates: coordinateData.extractedCoordinates,
    geoJSON: coordinateData.geoJSON,
    featureCount: coordinateData.featureCount,
    uploadConfig: null // Clear upload config
  })
}

/**
 * Handle upload status when file is still being processed
 * @param {object} status - Upload status response from CDP
 * @param {object} exemption - Exemption data from session
 * @param {object} h - Hapi response toolkit
 * @returns {object} Hapi response (view with processing status)
 */
function handleProcessingStatus(status, exemption, h) {
  // Show waiting page with meta refresh
  return h.view(UPLOAD_AND_WAIT_VIEW_ROUTE, {
    ...pageSettings,
    projectName: exemption.projectName,
    isProcessing: true,
    filename: status.filename
  })
}

/**
 * Handle upload status when file is ready for processing
 * @param {object} status - Upload status response from CDP
 * @param {object} uploadConfig - Upload configuration from session
 * @param {object} request - Hapi request object
 * @param {object} h - Hapi response toolkit
 * @returns {Promise<object>} Hapi response (redirect)
 */
async function handleReadyStatus(status, uploadConfig, request, h) {
  // Apply our business validation to files that passed CDP checks
  const fileValidationService = getFileValidationService(request.logger)
  const allowedExtensions = getAllowedExtensions(uploadConfig.fileType)

  const validation = fileValidationService.validateFileExtension(
    status.filename,
    allowedExtensions
  )

  if (!validation.isValid) {
    handleValidationError(request, validation, uploadConfig.fileType)
    return h.redirect(routes.FILE_UPLOAD)
  }

  // File passed all validations - extract coordinates and store details
  try {
    // Get S3 details for geo-parser API call
    const cdpUploadConfig = config.get('cdpUploader')
    const s3Bucket = cdpUploadConfig.s3Bucket
    const s3Key = status.s3Location.s3Key

    // Extract coordinates using geo-parser API
    const coordinateData = await extractCoordinatesFromFile(
      request,
      s3Bucket,
      s3Key,
      uploadConfig.fileType
    )

    // Store all successful upload data in session
    storeSuccessfulUpload(request, status, coordinateData, s3Bucket, s3Key)

    request.logger.info(
      'File upload and coordinate extraction completed successfully',
      {
        filename: status.filename,
        fileType: uploadConfig.fileType,
        featureCount: coordinateData.featureCount
      }
    )

    // Redirect to review site details page
    return h.redirect(routes.REVIEW_SITE_DETAILS)
  } catch (error) {
    // Handle geo-parser errors and redirect
    handleGeoParserError(request, error, status.filename, uploadConfig.fileType)
    return h.redirect(routes.FILE_UPLOAD)
  }
}

/**
 * Handle upload status when file is rejected or has an error
 * @param {object} status - Upload status response from CDP
 * @param {object} uploadConfig - Upload configuration from session
 * @param {object} request - Hapi request object
 * @param {object} h - Hapi response toolkit
 * @returns {object} Hapi response (redirect)
 */
function handleRejectedStatus(status, uploadConfig, request, h) {
  // Handle CDP rejection/error and redirect
  handleCdpRejectionError(request, status, uploadConfig.fileType)
  return h.redirect(routes.FILE_UPLOAD)
}

/**
 * Handle unknown upload status
 * @param {object} request - Hapi request object
 * @param {object} uploadConfig - Upload configuration from session
 * @param {object} status - Upload status response from CDP
 * @param {object} h - Hapi response toolkit
 * @returns {object} Hapi response (redirect)
 */
function handleUnknownStatus(request, uploadConfig, status, h) {
  // Unknown status - redirect to file type selection
  request.logger.warn('Unknown upload status', {
    uploadId: uploadConfig.uploadId,
    status: status.status
  })

  return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
}

/**
 * Process upload status and handle appropriate response
 * @param {object} status - Upload status response from CDP
 * @param {object} uploadConfig - Upload configuration from session
 * @param {object} request - Hapi request object
 * @param {object} h - Hapi response toolkit
 * @param {object} exemption - Exemption data from session
 * @returns {Promise<object>} Hapi response (view or redirect)
 */
async function processUploadStatus(
  status,
  uploadConfig,
  request,
  h,
  exemption
) {
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
    return handleProcessingStatus(status, exemption, h)
  }

  if (status.status === 'ready') {
    return handleReadyStatus(status, uploadConfig, request, h)
  }

  if (status.status === 'rejected' || status.status === 'error') {
    return handleRejectedStatus(status, uploadConfig, request, h)
  }

  // Unknown status
  return handleUnknownStatus(request, uploadConfig, status, h)
}

/**
 * A GDS styled upload complete page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const uploadAndWaitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    request.logger.debug(
      `uploadAndWaitController: exemption: ${JSON.stringify(exemption, null, 2)}`
    )
    const { uploadConfig } = exemption.siteDetails || {}

    if (!uploadConfig) {
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }

    try {
      const cdpService = getCdpUploadService()
      const status = await cdpService.getStatus(
        uploadConfig.uploadId,
        uploadConfig.statusUrl
      )

      return await processUploadStatus(
        status,
        uploadConfig,
        request,
        h,
        exemption
      )
    } catch (error) {
      request.logger.error('Failed to check upload status', {
        error: error.message,
        uploadId: uploadConfig.uploadId
      })

      // Clear upload config and redirect to file type selection
      updateExemptionSiteDetails(request, 'uploadConfig', null)
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }
  }
}
