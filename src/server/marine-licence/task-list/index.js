import {
  taskListController,
  taskListSelectMarineLicenceController
} from '#src/server/marine-licence/task-list/controller.js'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'

export const taskListRoutes = [
  {
    method: 'GET',
    path: marineLicenseRoutes.MARINE_LICENSE_TASK_LIST,
    ...taskListController
  },
  {
    method: 'GET',
    path: marineLicenseRoutes.MARINE_LICENSE_TASK_LIST + '/{id}',
    ...taskListSelectMarineLicenceController
  }
]
