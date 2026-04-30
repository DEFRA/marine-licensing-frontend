import {
  monthsOfActivityController,
  monthsOfActivitySubmitController
} from '#src/server/marine-licence/site-details/months-of-activity/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const monthsOfActivityRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MONTHS_OF_ACTIVITY,
    ...monthsOfActivityController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_MONTHS_OF_ACTIVITY,
    ...monthsOfActivitySubmitController
  }
]
