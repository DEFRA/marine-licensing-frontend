import {
  deleteAllSitesController,
  deleteAllSitesSubmitController
} from '#src/server/exemption/site-details/delete-all-sites/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const deleteAllSitesRoutes = [
  {
    method: 'GET',
    path: routes.DELETE_ALL_SITES,
    ...deleteAllSitesController
  },
  {
    method: 'POST',
    path: routes.DELETE_ALL_SITES,
    ...deleteAllSitesSubmitController
  }
]
