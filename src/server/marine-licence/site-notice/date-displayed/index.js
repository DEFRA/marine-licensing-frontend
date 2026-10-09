import {
  siteNoticeDateDisplayedController,
  siteNoticeDateDisplayedSubmitController
} from '#src/server/marine-licence/site-notice/date-displayed/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticeDateDisplayedRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DATE_DISPLAYED}/{marineLicenceId}`,
    ...siteNoticeDateDisplayedController
  },
  {
    method: 'POST',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DATE_DISPLAYED}/{marineLicenceId}`,
    ...siteNoticeDateDisplayedSubmitController
  }
]
