import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import {
  getMarinePlanPolicyQueryStartTime,
  triggerMarinePlanPolicyQuery
} from '#src/server/common/helpers/marine-licence/marine-plan-policy-query.js'

export const CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/calculate-marine-plan-policies-and-wait/index'

const WAIT_TIMEOUT_MS = 50_000

const waitPageView = () => ({
  pageTitle: 'Loading your Marine plan policies',
  heading: 'Loading your Marine plan policies',
  pageRefreshTimeInMs: 2000
})

async function handleFailedJob(request, h, marineLicenceId, taskList) {
  if (taskList?.siteDetails !== 'COMPLETED') {
    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  }

  await triggerMarinePlanPolicyQuery(request, marineLicenceId)
  return h.view(
    CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE,
    waitPageView()
  )
}

export const calculateMarinePlanPoliciesAndWaitController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!marineLicence?.id) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const marineLicenceService = getMarineLicenceService(request)
    const { marinePlanPolicyJob, taskList } =
      await marineLicenceService.getMarineLicenceById(marineLicence.id)

    if (marinePlanPolicyJob === 'failed') {
      return handleFailedJob(request, h, marineLicence.id, taskList)
    }

    const startedAt = getMarinePlanPolicyQueryStartTime(request)
    const hasTimedOut = startedAt && Date.now() - startedAt >= WAIT_TIMEOUT_MS

    if (marinePlanPolicyJob === 'ready' || hasTimedOut) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    return h.view(
      CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE,
      waitPageView()
    )
  }
}
