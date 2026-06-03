import {
  deleteAllSitesController,
  deleteAllSitesSubmitController
} from '#src/server/marine-licence/site-details/delete-all-sites/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const deleteAllSitesRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE_ALL_SITES,
    ...deleteAllSitesController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE_ALL_SITES,
    ...deleteAllSitesSubmitController
  }
]
