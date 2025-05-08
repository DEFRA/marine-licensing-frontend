import {
  publicRegisterController,
  publicRegisterSubmitController
} from '~/src/server/exemption/public-register/controller.js'

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
    path: '/exemption/public-register',
    ...publicRegisterController
  },
  {
    method: 'POST',
    path: '/exemption/public-register',
    ...publicRegisterSubmitController
  }
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
