export class FileValidationService {
  constructor(logger) {
    this.logger = logger
  }

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

  _extractExtension(filename) {
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
      return ''
    }
    return filename.substring(lastDotIndex + 1)
  }

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
