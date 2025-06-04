import {
  centreCoordinatesController,
  centreCoordinatesSubmitController
} from '~/src/server/exemption/site-details/centre-coordinates/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the centre coordinates page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const centreCoordinatesRoutes = [
  {
    method: 'GET',
    path: routes.CIRCLE_CENTRE_POINT,
    ...centreCoordinatesController
  },
  {
    method: 'POST',
    path: routes.CIRCLE_CENTRE_POINT,
    ...centreCoordinatesSubmitController
  }
]
