import {
  clearExemptionCache,
  getExemptionCache,
  resetExemptionSiteDetails,
  setExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'
import { transformTaskList } from '#src/server/exemption/task-list/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'

import Boom from '@hapi/boom'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

export const TASK_LIST_VIEW_ROUTE = 'exemption/task-list/index'

const taskListViewSettings = {
  pageTitle: 'Task list',
  heading: 'Task list',
  type: EXEMPTION_TYPE
}
export const taskListController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)

    if (!exemption?.id) {
      throw Boom.notFound(`Exemption not found`)
    }
    const { id } = exemption

    const { query } = request

    if (query?.cancel) {
      if (query.cancel === 'site-details') {
        resetExemptionSiteDetails(request)
      }

      return h.redirect(routes.TASK_LIST)
    }

    const { payload } = await authenticatedGetRequest(
      request,
      `/exemption/${id}`
    )

    const {
      id: exemptionId,
      taskList,
      projectName,
      publicRegister,
      multipleSiteDetails,
      siteDetails
    } = payload.value

    const taskListTransformed = transformTaskList(taskList)
    const hasCompletedAllTasks = taskListTransformed?.every(
      (task) => task.status.text === 'Completed'
    )

    await setExemptionCache(request, h, {
      id: exemptionId,
      projectName,
      publicRegister,
      multipleSiteDetails,
      siteDetails
    })

    request.yar.flash(RETURN_TO_CACHE_KEY)

    return h.view(TASK_LIST_VIEW_ROUTE, {
      ...taskListViewSettings,
      projectName: payload.value.projectName,
      taskList: taskListTransformed,
      hasCompletedAllTasks
    })
  }
}
export const taskListSelectExemptionController = {
  async handler(request, h) {
    const { exemptionId } = request.params
    await clearExemptionCache(request, h)
    await setExemptionCache(request, h, { id: exemptionId })
    return h.redirect(routes.TASK_LIST)
  }
}
