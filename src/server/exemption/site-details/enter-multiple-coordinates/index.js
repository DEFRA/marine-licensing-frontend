import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from '#src/server/exemption/site-details/enter-multiple-coordinates/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
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
