import {
  coordinatesTypeController,
  coordinatesTypeSubmitController
} from '~/src/server/exemption/site-details/coordinates-type/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the provide the coordinates choice page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const coordinatesTypeRoutes = [
  {
    method: 'GET',
    path: routes.COORDINATES_TYPE_CHOICE,
    ...coordinatesTypeController
  },
  {
    method: 'POST',
    path: routes.COORDINATES_TYPE_CHOICE,
    ...coordinatesTypeSubmitController
  }
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
