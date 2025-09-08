import { routes } from '~/src/server/common/constants/routes.js'
import {
  sameActivityDescriptionController,
  sameActivityDescriptionSubmitController
} from './controller.js'

/**
 * Sets up the routes used in the same activity description page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const sameActivityDescriptionRoutes = [
  {
    method: 'GET',
    path: routes.SAME_ACTIVITY_DESCRIPTION,
    ...sameActivityDescriptionController
  },
  {
    method: 'POST',
    path: routes.SAME_ACTIVITY_DESCRIPTION,
    ...sameActivityDescriptionSubmitController
  }
]
