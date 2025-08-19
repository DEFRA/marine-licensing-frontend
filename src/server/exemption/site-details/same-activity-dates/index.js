import { routes } from '~/src/server/common/constants/routes.js'
import {
  sameActivityDatesController,
  sameActivityDatesSubmitController
} from './controller.js'

/**
 * Sets up the routes used in the same activity dates page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
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
