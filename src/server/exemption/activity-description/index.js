import { routes } from '#src/server/common/constants/routes.js'
import {
  activityDescriptionController,
  activityDescriptionSubmitController
} from '#src/server/exemption/activity-description/controller.js'
export const activityDescriptionRoutes = [
  {
    method: 'GET',
    path: routes.ACTIVITY_DESCRIPTION,
    ...activityDescriptionController
  },
  {
    method: 'POST',
    path: routes.ACTIVITY_DESCRIPTION,
    ...activityDescriptionSubmitController
  }
]
