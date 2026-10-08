import { config } from '#src/config/config.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createFileUploadErrorDisplay } from '#src/server/common/helpers/file-upload/file-upload.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'

export const PHOTO_ACCEPT_ATTRIBUTE = '.jpg,.jpeg,.png'
export const PHOTO_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']
export const PHOTO_MAX_FILE_SIZE = 10 * 1024 * 1024
export const PHOTO_FILE_TYPE_ERROR_MESSAGE =
  'The selected file must be JPG, JPEG or PNG file'
export const PHOTO_FILE_SIZE_ERROR_MESSAGE =
  'The selected file must be smaller than 10 MB'
export const PHOTO_UPLOAD_SESSION_KEY = 'siteNoticePhotoUpload'

const PHOTO_S3_PATH = 'marine-licence/site-notice'

export const getPhotoUploadSession = (request) =>
  request.yar.get(PHOTO_UPLOAD_SESSION_KEY) ?? {}

export const setPhotoUploadSession = async (request, h, value) => {
  request.yar.set(PHOTO_UPLOAD_SESSION_KEY, value)
  await request.yar.commit(h)
}

export const siteNoticeDisplayUrl = (marineLicenceId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`

export const siteNoticeEvidenceUrl = (route, request) =>
  `${route}/${request.params.marineLicenceId}?location=${request.query.location}`

export const getPhotoUploadErrorDisplay = (request) => {
  const { uploadError } = getPhotoUploadSession(request)
  return uploadError ? createFileUploadErrorDisplay(uploadError, request) : {}
}

export const initiatePhotoUpload = async (
  request,
  h,
  { field, uploadPageUrl }
) => {
  const uploadConfig = await getCdpUploadService().initiate({
    redirectUrl: siteNoticeEvidenceUrl(
      marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_PHOTO_UPLOAD_AND_WAIT,
      request
    ),
    s3Path: PHOTO_S3_PATH,
    s3Bucket: config.get('cdpUploader').s3Bucket,
    allowedMimeTypes: PHOTO_ALLOWED_MIME_TYPES,
    maxFileSize: PHOTO_MAX_FILE_SIZE
  })

  await setPhotoUploadSession(request, h, {
    uploadId: uploadConfig.uploadId,
    statusUrl: uploadConfig.statusUrl,
    field,
    uploadPageUrl
  })

  return uploadConfig
}
