import {
  coordinatesEntryController,
  coordinatesEntrySubmitController
} from '~/src/server/exemption/site-details/coordinates-entry/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the provide the coordinates entry choice page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const coordinatesEntryRoutes = [
  {
    method: 'GET',
    path: routes.COORDINATES_ENTRY_CHOICE,
    ...coordinatesEntryController
  },
  {
    method: 'POST',
    path: routes.COORDINATES_ENTRY_CHOICE,
    ...coordinatesEntrySubmitController
  }
]
