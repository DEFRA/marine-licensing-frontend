import { routes } from '~/src/server/common/constants/routes.js'
import { siteNameController, siteNameSubmitController } from './controller.js'

/**
 * Sets up the routes used in the site name page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const siteNameRoutes = [
  {
    method: 'GET',
    path: routes.SITE_NAME,
    ...siteNameController
  },
  {
    method: 'POST',
    path: routes.SITE_NAME,
    ...siteNameSubmitController
  }
]
