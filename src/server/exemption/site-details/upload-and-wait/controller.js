import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { extractCoordinatesFromGeoJSON } from '#src/server/common/helpers/coordinate-utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import {
  getExemptionCache,
  updateExemptionMultipleSiteDetails,
  updateExemptionSiteDetails,
  updateExemptionSiteDetailsBatch
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { getFileValidationService } from '#src/services/file-validation/index.js'
import { isMultipleSitesFile } from '#src/server/exemption/site-details/upload-and-wait/utils.js'
import {
  GEO_PARSER_ERROR_MESSAGES,
  CDP_ERROR_MESSAGES,
  FILE_TYPE_ERROR_MESSAGES,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_GEO_PARSER_ERROR_MESSAGE
} from './error-messages.js'

export const UPLOAD_AND_WAIT_VIEW_ROUTE =
  'exemption/site-details/upload-and-wait/index'

const pageSettings = {
  pageTitle: 'Checking your file...',
  heading: 'Checking your file...',
  pageRefreshTimeInSeconds: 2
}

const getGeoParserErrorMessage = (errorCode) => {
  return (
    GEO_PARSER_ERROR_MESSAGES[errorCode] || DEFAULT_GEO_PARSER_ERROR_MESSAGE
  )
}

const getCdpErrorMessageFromCode = (errorCode, fileType) => {
  if (errorCode === 'INVALID_FILE_TYPE') {
    return FILE_TYPE_ERROR_MESSAGES[fileType] || CDP_ERROR_MESSAGES[errorCode]
  }

  return CDP_ERROR_MESSAGES[errorCode] || DEFAULT_ERROR_MESSAGE
}

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

async function extractCoordinatesFromFile(request, s3Bucket, s3Key, fileType) {
  try {
    request.logger.info(
      { s3Bucket, s3Key, fileType },
      `FileUpload: Calling geo-parser API`
    )
    const response = await callGeoParserAPI(request, s3Bucket, s3Key, fileType)

    const geoJSON = validateAndExtractGeoJSON(response)
    const extractedCoordinates = extractCoordinatesFromGeoJSON(geoJSON)

    logExtractionSuccess(request, geoJSON, extractedCoordinates)

    return buildCoordinateResult(geoJSON, extractedCoordinates)
  } catch (error) {
    logExtractionError(request, error, { s3Bucket, s3Key, fileType })
    throw error
  }
}

const callGeoParserAPI = async (request, s3Bucket, s3Key, fileType) => {
  return authenticatedPostRequest(request, '/geo-parser/extract', {
    s3Bucket,
    s3Key,
    fileType
  })
}

const validateAndExtractGeoJSON = (response) => {
  const { payload } = response

  if (payload?.message !== 'success') {
    throw new Error('Invalid geo-parser response')
  }

  const geoJSON = payload.value
  if (!geoJSON?.features) {
    throw new Error('Invalid GeoJSON structure')
  }

  return geoJSON
}

const logExtractionSuccess = (request, geoJSON, extractedCoordinates) => {
  request.logger.info(
    {
      featureCount: geoJSON.features.length,
      coordinateCount: extractedCoordinates.length
    },
    'FileUpload: Successfully extracted coordinates'
  )
}

const buildCoordinateResult = (geoJSON, extractedCoordinates) => ({
  geoJSON,
  extractedCoordinates,
  featureCount: geoJSON.features.length
})

const logExtractionError = (request, error, fileContext) => {
  request.logger.error(
    {
      err: error,
      ...fileContext
    },
    'FileUpload: ERROR: Failed to extract coordinates from file'
  )
}

async function handleValidationError(request, h, validation, fileType) {
  const errorDetails = {
    message: validation.errorMessage,
    fieldName: 'file'
  }
  await storeUploadError(request, h, errorDetails, fileType)
  return { redirect: routes.FILE_UPLOAD }
}

async function handleGeoParserError(request, h, error, filename, fileType) {
  let errorCode = null

  if (error.data?.payload?.message) {
    errorCode = error.data.payload.message
  }
  const message = getGeoParserErrorMessage(errorCode)

  const errorDetails = {
    message,
    fieldName: 'file',
    fileType
  }

  await storeUploadError(request, h, errorDetails, fileType)

  request.logger.error(
    {
      err: error,
      filename,
      fileType,
      errorCode,
      mappedMessage: message
    },
    'FileUpload: ERROR: Failed to extract coordinates from uploaded file'
  )

  return { redirect: routes.FILE_UPLOAD }
}

async function handleCdpRejectionError(request, h, status, fileType) {
  const errorMessage = status.errorCode
    ? getCdpErrorMessageFromCode(status.errorCode, fileType)
    : DEFAULT_ERROR_MESSAGE

  const errorDetails = {
    message: errorMessage,
    fieldName: 'file'
  }

  request.logger.error(
    {
      error: {
        code: status.errorCode,
        message: status.message,
        type: fileType
      }
    },
    'FileUpload: CDP rejection error'
  )

  await storeUploadError(request, h, errorDetails, fileType)
  return { redirect: routes.FILE_UPLOAD }
}

async function clearUploadSession(request, h) {
  await updateExemptionSiteDetails(request, h, 0, 'uploadConfig', null)
}

async function storeUploadError(request, h, errorDetails, fileType) {
  await updateExemptionSiteDetails(request, h, 0, 'uploadError', {
    message: errorDetails.message,
    fieldName: errorDetails.fieldName,
    fileType
  })
  await clearUploadSession(request, h)
}

async function storeSuccessfulUpload(
  request,
  h,
  status,
  coordinateData,
  s3Location
) {
  await updateExemptionMultipleSiteDetails(
    request,
    h,
    'multipleSitesEnabled',
    isMultipleSitesFile(coordinateData)
  )

  updateExemptionSiteDetailsBatch(request, status, coordinateData, s3Location, {
    isMultipleSitesFile: isMultipleSitesFile(coordinateData)
  })
}

function handleProcessingStatus(status, exemption, h) {
  // Show waiting page with meta refresh
  return h.view(UPLOAD_AND_WAIT_VIEW_ROUTE, {
    ...pageSettings,
    projectName: exemption.projectName,
    isProcessing: true,
    filename: status.filename
  })
}

async function handleReadyStatus(status, uploadConfig, request, h) {
  const validationResult = await validateUploadedFile(
    status,
    uploadConfig,
    request,
    h
  )
  if (!validationResult.isValid) {
    return h.redirect(routes.FILE_UPLOAD)
  }

  return processValidatedFile(status, uploadConfig, request, h)
}

const validateUploadedFile = async (status, uploadConfig, request, h) => {
  const fileValidationService = getFileValidationService(request.logger)
  const allowedExtensions = getAllowedExtensions(uploadConfig.fileType)
  const validation = fileValidationService.validateFileExtension(
    status.filename,
    allowedExtensions
  )

  if (!validation.isValid) {
    await handleValidationError(request, h, validation, uploadConfig.fileType)
  }

  return validation
}

const processValidatedFile = async (status, uploadConfig, request, h) => {
  try {
    const coordinateData = await extractAndStoreCoordinates(
      status,
      uploadConfig,
      request,
      h
    )
    logSuccessfulProcessing(request, status, uploadConfig, coordinateData)

    if (isMultipleSitesFile(coordinateData)) {
      return h.redirect(routes.SAME_ACTIVITY_DATES)
    }

    return h.redirect(routes.ACTIVITY_DATES)
  } catch (error) {
    await handleGeoParserError(
      request,
      h,
      error,
      status.filename,
      uploadConfig.fileType
    )
    return h.redirect(routes.FILE_UPLOAD)
  }
}

const extractAndStoreCoordinates = async (status, uploadConfig, request, h) => {
  const cdpUploadConfig = config.get('cdpUploader')
  const s3Bucket = cdpUploadConfig.s3Bucket
  const s3Key = status.s3Location.s3Key

  const coordinateData = await extractCoordinatesFromFile(
    request,
    s3Bucket,
    s3Key,
    uploadConfig.fileType
  )
  await storeSuccessfulUpload(request, h, status, coordinateData, {
    s3Bucket,
    s3Key
  })

  return coordinateData
}

const logSuccessfulProcessing = (
  request,
  status,
  uploadConfig,
  coordinateData
) => {
  request.logger.info(
    'FileUpload: File upload and coordinate extraction completed successfully',
    {
      filename: status.filename,
      fileType: uploadConfig.fileType,
      featureCount: coordinateData.featureCount
    }
  )
}
async function handleRejectedStatus(status, uploadConfig, request, h) {
  // Handle CDP rejection/error and redirect
  await handleCdpRejectionError(request, h, status, uploadConfig.fileType)
  return h.redirect(routes.FILE_UPLOAD)
}

function handleUnknownStatus(request, uploadConfig, status, h) {
  // Unknown status - redirect to file type selection
  request.logger.warn(
    {
      uploadId: uploadConfig.uploadId,
      status: status.status
    },
    'FileUpload: Unknown upload status'
  )

  return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
}

async function processUploadStatus(status, context) {
  const { uploadConfig, request, h, exemption } = context
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

export const uploadAndWaitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const site = getSiteDetailsBySite(exemption)

    const { uploadConfig } = site

    if (!uploadConfig) {
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
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
        exemption
      })
    } catch (error) {
      request.logger.error(
        {
          err: error,
          uploadId: uploadConfig.uploadId
        },
        'FileUpload: ERROR: Failed to check upload status'
      )

      // Clear upload config and redirect to file type selection
      await updateExemptionSiteDetails(request, h, 0, 'uploadConfig', null)
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE)
    }
  }
}
