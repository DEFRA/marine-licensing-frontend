import {
  projectNameController,
  projectNameSubmitController
} from '~/src/server/exemption/project-name/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the project name page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const projectNameRoutes = [
  {
    method: 'GET',
    path: routes.PROJECT_NAME,
    ...projectNameController
  },
  {
    method: 'POST',
    path: routes.PROJECT_NAME,
    ...projectNameSubmitController
  }
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
