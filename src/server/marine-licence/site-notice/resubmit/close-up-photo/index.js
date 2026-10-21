import { siteNoticeResubmitCloseUpPhotoController } from '#src/server/marine-licence/site-notice/resubmit/close-up-photo/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticeResubmitCloseUpPhotoRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO}/{marineLicenceId}/{taskId}`,
    ...siteNoticeResubmitCloseUpPhotoController
  }
]
