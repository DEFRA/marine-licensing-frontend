import rfc2047 from 'rfc2047'

export class FilenameHandler {
  constructor(logger) {
    this.logger = logger
  }

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

  decodeRfc2047Filename(encodedFilename) {
    try {
      return rfc2047.decode(encodedFilename)
    } catch (error) {
      this.logger.warn(
        {
          encodedfilename: encodedFilename,
          error: error.message
        },
        'Failed to decode RFC-2047 filename'
      )
      // Fallback: return as-is if we can't decode
      return encodedFilename
    }
  }

  hasFilenameData(fileData) {
    return !!(fileData?.filename || fileData?.encodedfilename)
  }
}
