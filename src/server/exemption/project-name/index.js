import {
  projectNameController,
  projectNameSubmitController
} from '~/src/server/exemption/project-name/controller.js'

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
    path: '/exemption/project-name',
    ...projectNameController
  },
  {
    method: 'POST',
    path: '/exemption/project-name',
    ...projectNameSubmitController
  }
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
