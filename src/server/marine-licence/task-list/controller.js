import {
  clearMarineLicenceCache,
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { transformTaskList } from '#src/server/marine-licence/task-list/utils.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

import Boom from '@hapi/boom'

export const TASK_LIST_VIEW_ROUTE = 'marine-licence/task-list/index'

const headingText = 'Marine licence start page'

const taskListViewSettings = {
  pageTitle: headingText,
  heading: headingText
}

export const taskListController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!marineLicence?.id) {
      throw Boom.notFound('Marine licence not found')
    }
    const { id } = marineLicence

    const { payload } = await authenticatedGetRequest(
      request,
      `/marine-licence/${id}`
    )

    const { id: marineLicenceId, taskList, projectName } = payload.value

    const taskListTransformed = transformTaskList(taskList)

    await setMarineLicenceCache(request, h, {
      id: marineLicenceId,
      projectName
    })

    const hasCompletedAllTasks = taskListTransformed?.every(
      (task) => task.status.text === 'Completed'
    )

    return h.view(TASK_LIST_VIEW_ROUTE, {
      ...taskListViewSettings,
      projectName: payload.value.projectName,
      taskList: taskListTransformed,
      hasCompletedAllTasks
    })
  }
}

export const taskListSelectMarineLicenceController = {
  async handler(request, h) {
    const { id } = request.params
    await clearMarineLicenceCache(request, h)
    await setMarineLicenceCache(request, h, { id })
    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  }
}
