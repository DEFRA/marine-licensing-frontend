import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  changeSiteLocationController,
  changeSiteLocationSubmitController
} from '#src/server/marine-licence/site-details/change-site-location/controller.js'

export const changeSiteLocationRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_CHANGE_SITE_LOCATION,
    ...changeSiteLocationController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_CHANGE_SITE_LOCATION,
    ...changeSiteLocationSubmitController
  }
]
