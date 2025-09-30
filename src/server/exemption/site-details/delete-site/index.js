import {
  deleteSiteController,
  deleteSiteSubmitController
} from '~/src/server/exemption/site-details/delete-site/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the delete site page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
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
