import { siteNoticeResubmitPhotoUploadAndWaitController } from '#src/server/marine-licence/site-notice/resubmit/photo-upload-and-wait/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticeResubmitPhotoUploadAndWaitRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT}/{marineLicenceId}/{taskId}`,
    ...siteNoticeResubmitPhotoUploadAndWaitController
  }
]
