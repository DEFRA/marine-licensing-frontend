import {
  centerCoordinatesController,
  centerCoordinatesSubmitController
} from '~/src/server/exemption/site-details/center-coordinates/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the center coordinates page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const centerCoordinatesRoutes = [
  {
    method: 'GET',
    path: routes.CIRCLE_CENTER_POINT,
    ...centerCoordinatesController
  },
  {
    method: 'POST',
    path: routes.CIRCLE_CENTER_POINT,
    ...centerCoordinatesSubmitController
  }
]
