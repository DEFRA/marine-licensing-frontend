import {
  coordinatesTypeController,
  coordinatesTypeSubmitController,
  PROVIDE_COORDINATES_CHOICE_ROUTE
} from '~/src/server/exemption/site-details/coordinates-type/controller.js'

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
    path: PROVIDE_COORDINATES_CHOICE_ROUTE,
    ...coordinatesTypeController
  },
  {
    method: 'POST',
    path: PROVIDE_COORDINATES_CHOICE_ROUTE,
    ...coordinatesTypeSubmitController
  }
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
