import { CdpUploadService, UPLOAD_STATUSES } from './cdp-upload-service.js'

/**
 * Get or create default CDP Upload service instance
 * @param {string[]?} allowedMimeTypes - Optional MIME types for file restrictions
 * @returns {CdpUploadService}
 */
export function getCdpUploadService(allowedMimeTypes = null) {
  return new CdpUploadService(allowedMimeTypes)
}

// Re-export the service class and status constants for direct usage
export { CdpUploadService, UPLOAD_STATUSES }
