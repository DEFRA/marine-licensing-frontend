import { routes } from '#src/server/common/constants/routes.js'
import {
  sameActivityDatesController,
  sameActivityDatesSubmitController
} from './controller.js'
export const sameActivityDatesRoutes = [
  {
    method: 'GET',
    path: routes.SAME_ACTIVITY_DATES,
    ...sameActivityDatesController
  },
  {
    method: 'POST',
    path: routes.SAME_ACTIVITY_DATES,
    ...sameActivityDatesSubmitController
  }
]
