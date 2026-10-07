import {
  siteNoticeLocationNameController,
  siteNoticeLocationNameSubmitController
} from '#src/server/marine-licence/site-notice/location-name/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticeLocationNameRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME}/{marineLicenceId}`,
    ...siteNoticeLocationNameController
  },
  {
    method: 'POST',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME}/{marineLicenceId}`,
    ...siteNoticeLocationNameSubmitController
  }
]
