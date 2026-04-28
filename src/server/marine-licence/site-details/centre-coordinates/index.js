import {
  centreCoordinatesController,
  centreCoordinatesSubmitController
} from '#src/server/marine-licence/site-details/centre-coordinates/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const centreCoordinatesRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
    ...centreCoordinatesController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
    ...centreCoordinatesSubmitController
  }
]
