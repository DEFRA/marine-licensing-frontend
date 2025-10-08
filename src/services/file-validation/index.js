import { FileValidationService } from './file-validation-service.js'

export function getFileValidationService(logger) {
  return new FileValidationService(logger)
}

export { FileValidationService }
