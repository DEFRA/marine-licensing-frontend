import {
  provideCoordinatesChoiceController,
  PROVIDE_COORDINATES_CHOICE_ROUTE
} from '~/src/server/exemption/site-details/provide-coordinates-choice/controller.js'

/**
 * Sets up the routes used in the provide the coordinates choice page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const provideCoordinatesChoiceRoutes = [
  {
    method: 'GET',
    path: PROVIDE_COORDINATES_CHOICE_ROUTE,
    ...provideCoordinatesChoiceController
  }
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
