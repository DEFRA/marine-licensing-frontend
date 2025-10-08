import {
  deleteSiteController,
  deleteSiteSubmitController
} from '#src/server/exemption/site-details/delete-site/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const deleteSiteRoutes = [
  {
    method: 'GET',
    path: routes.DELETE_SITE,
    ...deleteSiteController
  },
  {
    method: 'POST',
    path: routes.DELETE_SITE,
    ...deleteSiteSubmitController
  }
]
