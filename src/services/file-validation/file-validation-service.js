/**
 * File Validation Service
 *
 * Simple, reusable file validation focused on filename validation
 */
export class FileValidationService {
  constructor(logger) {
    this.logger = logger
  }

  /**
   * Validates if filename has allowed extension
   * @param {string} filename - The filename to validate
   * @param {string[]} allowedExtensions - Array of allowed extensions (case-insensitive)
   * @returns {object} Validation result with isValid and errorMessage
   */
  validateFileExtension(filename, allowedExtensions) {
    if (!filename || typeof filename !== 'string') {
      return {
        isValid: false,
        errorMessage: 'No filename provided'
      }
    }

    if (
      !allowedExtensions ||
      !Array.isArray(allowedExtensions) ||
      allowedExtensions.length === 0
    ) {
      return {
        isValid: false,
        errorMessage: 'No allowed extensions specified'
      }
    }

    const extension = this._extractExtension(filename).toLowerCase()
    const normalizedAllowed = allowedExtensions.map((ext) => ext.toLowerCase())
    const isValid = normalizedAllowed.includes(extension)

    this.logger.debug(
      {
        filename,
        extension,
        allowedExtensions: normalizedAllowed,
        isValid
      },
      'File extension validation'
    )

    return {
      isValid,
      extension,
      errorMessage: isValid ? null : this._buildErrorMessage(normalizedAllowed)
    }
  }

  /**
   * Extracts file extension from filename
   * @param {string} filename - The filename
   * @returns {string} The file extension without the dot
   * @private
   */
  _extractExtension(filename) {
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
      return ''
    }
    return filename.substring(lastDotIndex + 1)
  }

  /**
   * Builds user-friendly error message based on allowed extensions
   * @param {string[]} allowedExtensions - Normalized allowed extensions
   * @returns {string} Error message
   * @private
   */
  _buildErrorMessage(allowedExtensions) {
    if (allowedExtensions.length === 1) {
      const ext = allowedExtensions[0]
      if (ext === 'kml') {
        return 'The selected file must be a KML file'
      } else if (ext === 'zip') {
        return 'The selected file must be a Shapefile'
      } else {
        return `The selected file must be a ${ext.toUpperCase()} file`
      }
    } else {
      // Multiple extensions - build generic message
      const extList = allowedExtensions
        .map((ext) => ext.toUpperCase())
        .join(' or ')
      return `The selected file must be a ${extList} file`
    }
  }
}
