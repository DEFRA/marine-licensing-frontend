import {
  clearMarineLicenceCache,
  clearSingleSiteMode,
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { setProjectType } from '#src/server/common/helpers/session-cache/utils.js'
import {
  transformProjectDetailsTaskList,
  transformSiteDetailsTaskList,
  transformOtherPermissionsTaskList,
  transformSharingTaskList,
  transformWaterFrameworkDirectiveTaskList
} from '#src/server/marine-licence/task-list/utils.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'
import Boom from '@hapi/boom'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

export const TASK_LIST_VIEW_ROUTE = 'marine-licence/task-list/index'

const headingText = 'Marine licence start page'

const taskListViewSettings = {
  pageTitle: headingText,
  heading: headingText
}

function transformTaskLists(taskList, isCitizen, marineLicence) {
  return {
    otherPermissions: transformOtherPermissionsTaskList(taskList, isCitizen),
    sharing: transformSharingTaskList(taskList),
    projectDetails: transformProjectDetailsTaskList(taskList),
    siteDetails: transformSiteDetailsTaskList(taskList),
    waterFrameworkDirective: transformWaterFrameworkDirectiveTaskList(
      taskList,
      marineLicence.waterFrameworkDirective
    )
  }
}

async function updateLicenceSession(request, h, licenceData, hasCancel) {
  const {
    id: marineLicenceId,
    projectName,
    projectBackground,
    specialLegalPowers,
    preferredDates,
    publicRegister,
    publicConsultation,
    otherAuthorities,
    siteDetails,
    waterFrameworkDirective
  } = licenceData

  await setMarineLicenceCache(request, h, {
    id: marineLicenceId,
    projectName,
    projectBackground,
    specialLegalPowers,
    preferredDates,
    publicRegister,
    publicConsultation,
    otherAuthorities,
    siteDetails: hasCancel ? [] : siteDetails,
    waterFrameworkDirective
  })
  await setProjectType(request, h, PROJECT_TYPE.MARINE_LICENCE)
  await clearSingleSiteMode(request, h)
}

export const taskListController = {
  async handler(request, h) {
    request.yar.flash(RETURN_TO_CACHE_KEY)

    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    const marineLicence = getMarineLicenceCache(request)

    if (!marineLicence?.id) {
      throw Boom.notFound('Marine licence not found')
    }
    const { id } = marineLicence
    const hasCancel = request.query?.cancel === 'site-details'

    const { payload } = await authenticatedGetRequest(
      request,
      `/marine-licence/${id}`
    )
    const { taskList, projectName } = payload.value
    const { userRelationshipType } = userSession

    const transformed = transformTaskLists(
      taskList,
      userRelationshipType === USER_TYPES.CITIZEN,
      marineLicence
    )
    await updateLicenceSession(request, h, payload.value, hasCancel)

    const hasCompletedAllTasks = [
      ...transformed.otherPermissions,
      ...transformed.sharing,
      ...transformed.projectDetails,
      ...transformed.siteDetails,
      ...transformed.waterFrameworkDirective
    ].every((task) => task.status.text === 'Completed')

    return h.view(TASK_LIST_VIEW_ROUTE, {
      ...taskListViewSettings,
      projectName,
      otherPermissionsTaskList: transformed.otherPermissions,
      sharingTaskList: transformed.sharing,
      projectDetailsTaskList: transformed.projectDetails,
      siteDetailsTaskList: transformed.siteDetails,
      waterFrameworkDirectiveTaskList: transformed.waterFrameworkDirective,
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
