import {
  getMarineLicenseCache,
  setMarineLicenseCache
} from '#src/server/common/helpers/marine-license/session-cache/utils.js'
import { transformTaskList } from '#src/server/marine-license/task-list/utils.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'

import Boom from '@hapi/boom'

export const TASK_LIST_VIEW_ROUTE = 'marine-license/task-list/index'

const headingText = 'Marine licence start page'

const taskListViewSettings = {
  pageTitle: headingText,
  heading: headingText
}

export const taskListController = {
  async handler(request, h) {
    const marineLicense = getMarineLicenseCache(request)

    if (!marineLicense?.id) {
      throw Boom.notFound('Marine license not found')
    }
    const { id } = marineLicense

    const { payload } = await authenticatedGetRequest(
      request,
      `/marine-license/${id}`
    )

    const { id: marineLicenseId, taskList, projectName } = payload.value

    const taskListTransformed = transformTaskList(taskList)

    await setMarineLicenseCache(request, h, {
      id: marineLicenseId,
      projectName
    })

    return h.view(TASK_LIST_VIEW_ROUTE, {
      ...taskListViewSettings,
      projectName: payload.value.projectName,
      taskList: taskListTransformed
    })
  }
}
