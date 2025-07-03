/**
 * S3 Location Builder Utility
 *
 * Handles building S3 location objects from CDP file data.
 * Extracted to eliminate duplication and centralize S3 logic.
 */

/**
 * @typedef {object} S3Location
 * @property {string} s3Bucket - The S3 bucket name
 * @property {string} s3Key - The S3 object key
 * @property {string} fileId - Unique identifier for the file
 * @property {string} s3Url - Full S3 URL in format s3://bucket/key
 * @property {string} detectedContentType - The detected MIME type of the file
 * @property {string} checksumSha256 - SHA256 checksum of the file
 */

export class S3LocationBuilder {
  /**
   * Builds S3 location object from file data
   * @param {object} fileData - File data from CDP response
   * @returns {S3Location} S3 location object with all metadata
   */
  static buildS3LocationObject(fileData) {
    return {
      s3Bucket: fileData.s3Bucket,
      s3Key: fileData.s3Key,
      fileId: fileData.fileId,
      s3Url: `s3://${fileData.s3Bucket}/${fileData.s3Key}`,
      detectedContentType: fileData.detectedContentType,
      checksumSha256: fileData.checksumSha256
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
