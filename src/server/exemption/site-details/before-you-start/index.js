import { beforeYouStartController } from '~/src/server/exemption/site-details/before-you-start/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the before you start site details page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const beforeYouStartRoutes = [
  {
    method: 'GET',
    path: routes.SITE_DETAILS,
    ...beforeYouStartController
  }
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
