import { config } from '~/src/config/config.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import { transformTaskList } from '~/src/server/exemption/task-list/utils.js'

import Wreck from '@hapi/wreck'
import Boom from '@hapi/boom'

export const TASK_LIST_ROUTE = '/exemption/task-list'
export const TASK_LIST_VIEW_ROUTE = 'exemption/task-list/index'

const taskListViewSettings = {
  pageTitle: 'Task list',
  heading: 'Task list'
}

/**
 * A GDS styled task list page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const taskListController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)

    const { id } = exemption

    if (!id) {
      throw Boom.notFound(`Exemption not found`, { id })
    }

    const { payload } = await Wreck.get(
      `${config.get('backend').apiUrl}/exemption/${id}`,
      {
        json: true
      }
    )

    return h.view(TASK_LIST_VIEW_ROUTE, {
      ...taskListViewSettings,
      projectName: payload.value.projectName,
      taskList: transformTaskList(payload.value.taskList)
    })
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
