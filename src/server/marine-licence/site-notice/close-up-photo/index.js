import {
  siteNoticeCloseUpPhotoController,
  siteNoticeCloseUpPhotoSubmitController
} from '#src/server/marine-licence/site-notice/close-up-photo/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticeCloseUpPhotoRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/{marineLicenceId}`,
    ...siteNoticeCloseUpPhotoController
  },
  {
    method: 'POST',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/{marineLicenceId}`,
    ...siteNoticeCloseUpPhotoSubmitController
  }
]
