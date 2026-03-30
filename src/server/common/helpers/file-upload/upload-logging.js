export const logExtractionError = (request, error, fileContext) => {
  request.logger.error(
    {
      err: error,
      ...fileContext
    },
    'FileUpload: ERROR: Failed to extract coordinates from file'
  )
}

export const logExtractionSuccess = (
  request,
  geoJSON,
  extractedCoordinates
) => {
  request.logger.info(
    {
      featureCount: geoJSON.features.length,
      coordinateCount: extractedCoordinates.length
    },
    'FileUpload: Successfully extracted coordinates'
  )
}

export const logSuccessfulProcessing = (
  request,
  status,
  uploadConfig,
  coordinateData
) => {
  request.logger.info(
    {
      filename: status.filename,
      fileType: uploadConfig.fileType,
      featureCount: coordinateData.featureCount
    },
    'FileUpload: File upload and coordinate extraction completed successfully'
  )
}
