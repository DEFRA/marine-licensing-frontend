import {
  deleteSiteController,
  deleteSiteSubmitController
} from '#src/server/marine-licence/site-details/delete-site/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const deleteSiteRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE_SITE,
    ...deleteSiteController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE_SITE,
    ...deleteSiteSubmitController
  }
]
