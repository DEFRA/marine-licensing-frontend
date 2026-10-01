import {
  siteNoticePositionPhotoController,
  siteNoticePositionPhotoSubmitController
} from '#src/server/marine-licence/site-notice/position-photo/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticePositionPhotoRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO}/{marineLicenceId}`,
    ...siteNoticePositionPhotoController
  },
  {
    method: 'POST',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO}/{marineLicenceId}`,
    ...siteNoticePositionPhotoSubmitController
  }
]
