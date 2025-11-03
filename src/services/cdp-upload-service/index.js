import { CdpUploadService } from './cdp-upload-service.js'

export function getCdpUploadService(allowedMimeTypes = null) {
  return new CdpUploadService(allowedMimeTypes)
}

export {
  CdpUploadService,
  UPLOAD_STATUSES,
  CDP_ERROR_CODES
} from './cdp-upload-service.js'
