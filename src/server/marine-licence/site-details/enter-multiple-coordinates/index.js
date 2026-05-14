import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from '#src/server/marine-licence/site-details/enter-multiple-coordinates/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const enterMultipleCoordinatesRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
    ...multipleCoordinatesController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
    ...multipleCoordinatesSubmitController
  }
]
