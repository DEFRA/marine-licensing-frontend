import rfc2047 from 'rfc2047'

/**
 * Filename Handler Utility
 *
 * Handles filename extraction and RFC-2047 decoding
 */
export class FilenameHandler {
  /**
   * @param {object} logger - Logger instance for warnings
   */
  constructor(logger) {
    this.logger = logger
  }

  /**
   * Extracts filename from file data, handling both regular and RFC-2047 encoded filenames
   *
   * As per CdpFileData typedef: either filename or encodedfilename will be provided
   * depending on whether the original filename contained non-ascii characters.
   * @param {object} fileData - File data from CDP response
   * @returns {string} Decoded filename
   */
  extractFilename(fileData) {
    if (!fileData) {
      return 'unknown-file'
    }

    if (fileData.filename) {
      return fileData.filename
    }

    if (fileData.encodedfilename) {
      return this.decodeRfc2047Filename(fileData.encodedfilename)
    }

    return 'unknown-file'
  }

  /**
   * Decodes RFC-2047 encoded filename with proper error handling
   * @param {string} encodedFilename - RFC-2047 encoded filename
   * @returns {string} Decoded filename or original if decoding fails
   */
  decodeRfc2047Filename(encodedFilename) {
    try {
      return rfc2047.decode(encodedFilename)
    } catch (error) {
      this.logger.warn('Failed to decode RFC-2047 filename', {
        encodedfilename: encodedFilename,
        error: error.message
      })
      // Fallback: return as-is if we can't decode
      return encodedFilename
    }
  }

  /**
   * Validates that file data contains filename information
   * @param {object} fileData - File data to validate
   * @returns {boolean} True if filename or encodedfilename is present
   */
  hasFilenameData(fileData) {
    return !!(fileData?.filename || fileData?.encodedfilename)
  }
}
