import {
  centreCoordinatesController,
  centreCoordinatesSubmitController
} from '#src/server/exemption/site-details/centre-coordinates/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
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
