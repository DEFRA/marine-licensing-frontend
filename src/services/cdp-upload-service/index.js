import { CdpUploadService, UPLOAD_STATUSES } from './cdp-upload-service.js'

export function getCdpUploadService(allowedMimeTypes = null) {
  return new CdpUploadService(allowedMimeTypes)
}

export { CdpUploadService, UPLOAD_STATUSES }
