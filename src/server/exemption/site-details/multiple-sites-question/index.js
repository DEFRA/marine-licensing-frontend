import { routes } from '~/src/server/common/constants/routes.js'
import {
  multipleSitesController,
  multipleSitesSubmitController
} from './controller.js'

/**
 * Sets up the routes used in the multiple sites question page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const multipleSitesChoiceRoutes = [
  {
    method: 'GET',
    path: routes.MULTIPLE_SITES_CHOICE,
    ...multipleSitesController
  },
  {
    method: 'POST',
    path: routes.MULTIPLE_SITES_CHOICE,
    ...multipleSitesSubmitController
  }
]
