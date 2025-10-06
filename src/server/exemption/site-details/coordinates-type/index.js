import {
  coordinatesTypeController,
  coordinatesTypeSubmitController
} from '#src/server/exemption/site-details/coordinates-type/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
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
