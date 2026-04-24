import {
  activityDescriptionController,
  activityDescriptionSubmitController
} from '#src/server/marine-licence/site-details/activity-description/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const activityDescriptionRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_ACTIVITY_DESCRIPTION,
    ...activityDescriptionController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_ACTIVITY_DESCRIPTION,
    ...activityDescriptionSubmitController
  }
]
