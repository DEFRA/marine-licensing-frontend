import { taskListController } from '~/src/server/exemption/task-list/controller.js'

/**
 * Sets up the routes used in the task list page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const taskListRoutes = [
  {
    method: 'GET',
    path: '/exemption/task-list',
    ...taskListController
  }
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
