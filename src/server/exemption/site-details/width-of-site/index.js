import {
  widthOfSiteController,
  widthOfSiteSubmitController
} from '~/src/server/exemption/site-details/width-of-site/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the provide the width of site page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const widthOfSiteRoutes = [
  {
    method: 'GET',
    path: routes.WIDTH_OF_SITE,
    ...widthOfSiteController
  },
  {
    method: 'POST',
    path: routes.WIDTH_OF_SITE,
    ...widthOfSiteSubmitController
  }
]
