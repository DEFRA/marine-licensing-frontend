/**
 * S3 Location Builder Utility
 *
 * Handles building S3 location objects from CDP file data.
 * Extracted to eliminate duplication and centralize S3 logic.
 */
export class S3LocationBuilder {
  /**
   * Builds S3 location object from file data
   * @param {object} fileData - File data from CDP response
   * @param {Function} getTimestamp - Function to get current timestamp
   * @param {Function} extractFilename - Function to extract filename from file data
   * @returns {object} S3 location object with all metadata
   */
  static buildS3LocationObject(fileData, getTimestamp, extractFilename) {
    return {
      s3Bucket: fileData.s3Bucket,
      s3Key: fileData.s3Key,
      fileId: fileData.fileId,
      s3Url: `s3://${fileData.s3Bucket}/${fileData.s3Key}/${fileData.fileId}`,
      detectedContentType: fileData.detectedContentType,
      checksumSha256: fileData.checksumSha256,
      contentLength: fileData.contentLength,
      filename: extractFilename(fileData),
      fileSize: fileData.contentLength, // Alias for contentLength
      uploadedAt: getTimestamp()
    }
  }

  /**
   * Validates that file data has all required S3 fields
   * @param {object} fileData - File data to validate
   * @returns {boolean} True if all required S3 fields are present
   */
  static hasRequiredS3Fields(fileData) {
    return !!(
      fileData?.s3Key &&
      fileData?.s3Bucket &&
      fileData?.fileId &&
      fileData.contentLength
    )
  }

  /**
   * Checks if file is ready for S3 location extraction
   * @param {object} fileData - File data to check
   * @param {string} fileStatus - Expected file status for readiness
   * @returns {boolean} True if file is ready for S3 extraction
   */
  static isFileReadyForS3(fileData, fileStatus) {
    return (
      fileData.fileStatus === fileStatus &&
      S3LocationBuilder.hasRequiredS3Fields(fileData)
    )
  }
}
