import { FileValidationService } from './file-validation-service.js'

/**
 * Get or create FileValidationService instance
 * @param {object} logger - Logger instance for debugging
 * @returns {FileValidationService}
 */
export function getFileValidationService(logger) {
  return new FileValidationService(logger)
}

// Re-export the service class for direct usage
export { FileValidationService }
