import {
  clearMarineLicenceCache,
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { setProjectType } from '#src/server/common/helpers/session-cache/utils.js'
import {
  transformProjectDetailsTaskList,
  transformSiteDetailsTaskList,
  transformOtherPermissionsTaskList,
  transformSharingTaskList
} from '#src/server/marine-licence/task-list/utils.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'
import Boom from '@hapi/boom'

export const TASK_LIST_VIEW_ROUTE = 'marine-licence/task-list/index'

const headingText = 'Marine licence start page'

const taskListViewSettings = {
  pageTitle: headingText,
  heading: headingText
}

export const taskListController = {
  async handler(request, h) {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    const marineLicence = getMarineLicenceCache(request)

    if (!marineLicence?.id) {
      throw Boom.notFound('Marine licence not found')
    }
    const { id } = marineLicence

    const { query } = request

    const hasCancel = query?.cancel === 'site-details'

    const { payload } = await authenticatedGetRequest(
      request,
      `/marine-licence/${id}`
    )

    const {
      id: marineLicenceId,
      taskList,
      projectName,
      specialLegalPowers,
      publicRegister,
      otherAuthorities,
      siteDetails
    } = payload.value

    const { userRelationshipType } = userSession

    const otherPermissionsTaskListTransformed =
      transformOtherPermissionsTaskList(
        taskList,
        userRelationshipType === USER_TYPES.CITIZEN
      )

    const sharingTaskListTransformed = transformSharingTaskList(taskList)
    const projectDetailsTaskListTransformed =
      transformProjectDetailsTaskList(taskList)
    const siteDetailsTaskListTransformed =
      transformSiteDetailsTaskList(taskList)

    await setMarineLicenceCache(request, h, {
      id: marineLicenceId,
      projectName,
      specialLegalPowers,
      publicRegister,
      otherAuthorities,
      siteDetails: hasCancel ? [] : siteDetails
    })

    await setProjectType(request, h, PROJECT_TYPE.MARINE_LICENCE)

    const hasCompletedAllTasks = [
      ...otherPermissionsTaskListTransformed,
      ...sharingTaskListTransformed,
      ...projectDetailsTaskListTransformed,
      ...siteDetailsTaskListTransformed
    ]
      // Filter is temporary until we get to saving to the back end for 'Site Details'
      .filter((task) => task.title.text !== 'Site details')
      .every((task) => task.status.text === 'Completed')

    return h.view(TASK_LIST_VIEW_ROUTE, {
      ...taskListViewSettings,
      projectName: payload.value.projectName,
      otherPermissionsTaskList: otherPermissionsTaskListTransformed,
      sharingTaskList: sharingTaskListTransformed,
      projectDetailsTaskList: projectDetailsTaskListTransformed,
      siteDetailsTaskList: siteDetailsTaskListTransformed,
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
