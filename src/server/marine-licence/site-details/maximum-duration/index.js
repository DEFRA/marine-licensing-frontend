import {
  durationController,
  durationSubmitController
} from '#src/server/marine-licence/site-details/maximum-duration/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const durationRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_DURATION,
    ...durationController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_DURATION,
    ...durationSubmitController
  }
]
