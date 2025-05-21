import { taskListController } from '~/src/server/exemption/task-list/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

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
    path: routes.TASK_LIST,
    ...taskListController
  }
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
