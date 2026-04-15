import {
  typeOfActivityController,
  typeOfActivitySubmitController
} from '#src/server/marine-licence/site-details/type-of-activity/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const typeOfActivityRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY,
    ...typeOfActivityController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY,
    ...typeOfActivitySubmitController
  }
]
