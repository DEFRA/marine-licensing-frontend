import { siteNoticeResubmitPositionPhotoController } from '#src/server/marine-licence/site-notice/resubmit/position-photo/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticeResubmitPositionPhotoRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_POSITION_PHOTO}/{marineLicenceId}/{taskId}`,
    ...siteNoticeResubmitPositionPhotoController
  }
]
