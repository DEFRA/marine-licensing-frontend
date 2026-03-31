import { config } from '#src/config/config.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { extractCoordinatesFromGeoJSON } from '#src/server/common/helpers/coordinate-utils.js'
import {
  logExtractionSuccess,
  logExtractionError
} from '#src/server/common/helpers/file-upload/upload-logging.js'
import { getFileValidationService } from '#src/services/file-validation/index.js'
import { getAllowedExtensions } from '#src/server/common/helpers/file-upload/file-upload.js'

const buildCoordinateResult = (geoJSON, extractedCoordinates) => ({
  geoJSON,
  extractedCoordinates,
  featureCount: geoJSON.features.length
})

export const validateAndExtractGeoJSON = (response) => {
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

const callGeoParserAPI = async (request, s3Bucket, s3Key, fileType) => {
  return authenticatedPostRequest(request, '/geo-parser/extract', {
    s3Bucket,
    s3Key,
    fileType
  })
}

export const extractCoordinatesFromFile = async (
  request,
  s3Bucket,
  s3Key,
  fileType
) => {
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

export const extractCoordinates = async ({ status, uploadConfig, request }) => {
  const cdpUploadConfig = config.get('cdpUploader')
  const s3Bucket = cdpUploadConfig.s3Bucket
  const s3Key = status.s3Location.s3Key

  const coordinateData = await extractCoordinatesFromFile(
    request,
    s3Bucket,
    s3Key,
    uploadConfig.fileType
  )

  return coordinateData
}

export const extractGeoParserErrorCode = (error) =>
  error.data?.payload?.message ?? null

export const validateUploadedFile = async (status, uploadConfig, request) => {
  const fileValidationService = getFileValidationService(request.logger)
  const allowedExtensions = getAllowedExtensions(uploadConfig.fileType)
  const validation = fileValidationService.validateFileExtension(
    status.filename,
    allowedExtensions
  )

  return validation
}
