import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'

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
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(TASK_LIST_VIEW_ROUTE, {
      ...taskListViewSettings,
      projectName: exemption.projectName
    })
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
