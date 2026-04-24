import {
  activityDurationController,
  activityDurationSubmitController
} from '#src/server/marine-licence/site-details/activity-duration/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const durationRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_DURATION,
    ...activityDurationController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_DURATION,
    ...activityDurationSubmitController
  }
]
