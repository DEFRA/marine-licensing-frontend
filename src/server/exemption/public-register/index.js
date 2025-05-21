import {
  publicRegisterController,
  publicRegisterSubmitController
} from '~/src/server/exemption/public-register/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the public register page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const publicRegisterRoutes = [
  {
    method: 'GET',
    path: routes.PUBLIC_REGISTER,
    ...publicRegisterController
  },
  {
    method: 'POST',
    path: routes.PUBLIC_REGISTER,
    ...publicRegisterSubmitController
  }
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
