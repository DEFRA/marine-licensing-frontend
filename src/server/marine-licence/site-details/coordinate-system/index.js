import {
  coordinateSystemController,
  coordinateSystemSubmitController
} from '#src/server/marine-licence/site-details/coordinate-system/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const coordinateSystemRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
    ...coordinateSystemController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
    ...coordinateSystemSubmitController
  }
]
