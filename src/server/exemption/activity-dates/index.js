import { routes } from '#src/server/common/constants/routes.js'
import {
  activityDatesController,
  activityDatesSubmitController
} from './controller.js'

export const activityDatesRoutes = [
  {
    method: 'GET',
    path: routes.ACTIVITY_DATES,
    ...activityDatesController
  },
  {
    method: 'POST',
    path: routes.ACTIVITY_DATES,
    ...activityDatesSubmitController
  }
]
