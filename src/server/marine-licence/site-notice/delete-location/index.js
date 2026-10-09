import {
  deleteLocationController,
  deleteLocationSubmitController
} from '#src/server/marine-licence/site-notice/delete-location/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticeDeleteLocationRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DELETE_LOCATION,
    ...deleteLocationController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DELETE_LOCATION,
    ...deleteLocationSubmitController
  }
]
