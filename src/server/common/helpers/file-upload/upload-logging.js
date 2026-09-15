export const logExtractionError = (request, error, fileContext) => {
  request.logger.error(
    {
      err: error,
      event: { action: 'coordinate_extraction_failed' },
      tenant: {
        message: `s3Bucket=${fileContext.s3Bucket} s3Key=${fileContext.s3Key} fileType=${fileContext.fileType}`
      }
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
      event: { action: 'coordinate_extraction_success' },
      tenant: {
        message: `featureCount=${geoJSON.features.length} coordinateCount=${extractedCoordinates.length}`
      }
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
      event: { action: 'file_upload_processing_success' },
      tenant: {
        message: `filename=${status.filename} fileType=${uploadConfig.fileType} featureCount=${coordinateData.featureCount}`
      }
    },
    'FileUpload: File upload and coordinate extraction completed successfully'
  )
}
