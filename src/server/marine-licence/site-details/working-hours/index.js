import {
  workingHoursController,
  workingHoursSubmitController
} from '#src/server/marine-licence/site-details/working-hours/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const workingHoursRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WORKING_HOURS,
    ...workingHoursController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_WORKING_HOURS,
    ...workingHoursSubmitController
  }
]
