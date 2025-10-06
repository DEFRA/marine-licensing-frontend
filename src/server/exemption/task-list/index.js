import {
  taskListController,
  taskListSelectExemptionController
} from '#src/server/exemption/task-list/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const taskListRoutes = [
  {
    method: 'GET',
    path: routes.TASK_LIST,
    ...taskListController
  },
  {
    method: 'GET',
    path: routes.TASK_LIST + '/{exemptionId}',
    ...taskListSelectExemptionController
  }
]
