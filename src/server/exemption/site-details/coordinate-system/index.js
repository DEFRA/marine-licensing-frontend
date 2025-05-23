import {
  coordinateSystemController,
  coordinateSystemSubmitController
} from '~/src/server/exemption/site-details/coordinate-system/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the coordinate system choice page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const coordinateSystemRoutes = [
  {
    method: 'GET',
    path: routes.COORDINATE_SYSTEM_CHOICE,
    ...coordinateSystemController
  },
  {
    method: 'POST',
    path: routes.COORDINATE_SYSTEM_CHOICE,
    ...coordinateSystemSubmitController
  }
]
