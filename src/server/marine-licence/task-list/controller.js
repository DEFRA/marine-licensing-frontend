import {
  clearMarineLicenceCache,
  clearSingleSiteMode,
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { setProjectType } from '#src/server/common/helpers/session-cache/utils.js'
import {
  transformFeeEstimateTaskList,
  transformProjectDetailsTaskList,
  transformSiteDetailsTaskList,
  transformOtherPermissionsTaskList,
  transformSharingTaskList,
  transformWaterFrameworkDirectiveTaskList,
  transformMarinePlanPoliciesTaskList
} from '#src/server/marine-licence/task-list/utils.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'
import Boom from '@hapi/boom'
import { clearReturnToCache } from '#src/server/common/helpers/marine-licence/session-cache/return-to-cache.js'
import { clearWaterFrameworkDirectiveReturnToCache } from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'

export const TASK_LIST_VIEW_ROUTE = 'marine-licence/task-list/index'

const headingText = 'Marine licence start page'

const taskListViewSettings = {
  pageTitle: headingText,
  heading: headingText
}

function transformTaskLists(
  taskList,
  isCitizen,
  {
    waterFrameworkDirective,
    marinePlanPolicyJob,
    marinePlanPoliciesCount,
    marinePlanPolicyResponseCount
  }
) {
  return {
    feeEstimate: transformFeeEstimateTaskList(taskList),
    otherPermissions: transformOtherPermissionsTaskList(taskList, isCitizen),
    sharing: transformSharingTaskList(taskList),
    projectDetails: transformProjectDetailsTaskList(taskList),
    siteDetails: transformSiteDetailsTaskList(taskList),
    waterFrameworkDirective: transformWaterFrameworkDirectiveTaskList(
      taskList,
      waterFrameworkDirective
    ),
    marinePlanPolicies: transformMarinePlanPoliciesTaskList(taskList, {
      marinePlanPolicyJob,
      marinePlanPoliciesCount,
      marinePlanPolicyResponseCount
    })
  }
}

async function updateLicenceSession(request, h, licenceData, hasCancel) {
  const {
    id: marineLicenceId,
    feeEstimate,
    projectName,
    projectBackground,
    specialLegalPowers,
    preferredDates,
    publicRegister,
    publicConsultation,
    otherAuthorities,
    harbourAuthority,
    siteDetails,
    waterFrameworkDirective
  } = licenceData

  await setMarineLicenceCache(request, h, {
    id: marineLicenceId,
    feeEstimate,
    projectName,
    projectBackground,
    specialLegalPowers,
    preferredDates,
    publicRegister,
    publicConsultation,
    otherAuthorities,
    harbourAuthority,
    siteDetails: hasCancel ? [] : siteDetails,
    waterFrameworkDirective
  })
  await setProjectType(request, h, PROJECT_TYPE.MARINE_LICENCE)
  await clearSingleSiteMode(request, h)
}

export const taskListController = {
  async handler(request, h) {
    clearReturnToCache(request)
    clearWaterFrameworkDirectiveReturnToCache(request)

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
    const {
      taskList,
      projectName,
      waterFrameworkDirective,
      marinePlanPolicyJob,
      marinePlanPoliciesCount,
      marinePlanPolicyResponseCount,
      siteDetailsConfirmed
    } = payload.value
    const { userRelationshipType } = userSession

    const effectiveTaskList = {
      ...taskList,
      siteDetails:
        taskList.siteDetails === 'COMPLETED' && !siteDetailsConfirmed
          ? 'IN_PROGRESS'
          : taskList.siteDetails
    }

    const transformed = transformTaskLists(
      effectiveTaskList,
      userRelationshipType === USER_TYPES.CITIZEN,
      {
        waterFrameworkDirective,
        marinePlanPolicyJob,
        marinePlanPoliciesCount,
        marinePlanPolicyResponseCount
      }
    )

    await updateLicenceSession(request, h, payload.value, hasCancel)

    const hasCompletedAllTasks = [
      ...transformed.otherPermissions,
      ...transformed.sharing,
      ...transformed.projectDetails,
      ...transformed.siteDetails,
      ...transformed.waterFrameworkDirective,
      ...transformed.feeEstimate,
      ...transformed.marinePlanPolicies
    ]
      .filter((task) => task.title.text !== 'Invoicing details')
      .every((task) => task.status.text === 'Completed')

    return h.view(TASK_LIST_VIEW_ROUTE, {
      ...taskListViewSettings,
      projectName,
      otherPermissionsTaskList: transformed.otherPermissions,
      sharingTaskList: transformed.sharing,
      projectDetailsTaskList: transformed.projectDetails,
      siteDetailsTaskList: transformed.siteDetails,
      waterFrameworkDirectiveTaskList: transformed.waterFrameworkDirective,
      feeEstimateTaskList: transformed.feeEstimate,
      marinePlanPoliciesTaskList: transformed.marinePlanPolicies,
      marinePlanPolicyGuidanceLink:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE,
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
