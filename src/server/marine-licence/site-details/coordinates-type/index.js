import {
  coordinatesTypeController,
  coordinatesTypeSubmitController
} from '#src/server/marine-licence/site-details/coordinates-type/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const coordinatesTypeRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
    ...coordinatesTypeController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
    ...coordinatesTypeSubmitController
  }
]
