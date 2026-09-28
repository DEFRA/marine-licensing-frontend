import { siteNoticeDisplayController } from '#src/server/marine-licence/site-notice/display/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticeDisplayRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/{marineLicenceId}`,
    ...siteNoticeDisplayController
  }
]
