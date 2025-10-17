import { routes } from '#src/server/common/constants/routes.js'
import {
  activityDatesController,
  activityDatesSubmitController
} from './controller.js'

export const activityDatesRoutes = [
  {
    method: 'GET',
    path: routes.SITE_DETAILS_ACTIVITY_DATES,
    ...activityDatesController
  },
  {
    method: 'POST',
    path: routes.SITE_DETAILS_ACTIVITY_DATES,
    ...activityDatesSubmitController
  }
]
