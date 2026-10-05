import { siteNoticePhotoUploadAndWaitController } from '#src/server/marine-licence/site-notice/photo-upload-and-wait/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticePhotoUploadAndWaitRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_PHOTO_UPLOAD_AND_WAIT}/{marineLicenceId}`,
    ...siteNoticePhotoUploadAndWaitController
  }
]
