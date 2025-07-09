import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from '~/src/server/exemption/site-details/enter-multiple-coordinates/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the enter multiple coordinates page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const enterMultipleCoordinatesRoutes = [
  {
    method: 'GET',
    path: routes.ENTER_MULTIPLE_COORDINATES,
    ...multipleCoordinatesController
  },
  {
    method: 'POST',
    path: routes.ENTER_MULTIPLE_COORDINATES,
    ...multipleCoordinatesSubmitController
  }
]
