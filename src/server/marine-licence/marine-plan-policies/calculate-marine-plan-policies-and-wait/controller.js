import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getMarinePlanPolicyQueryStartTime } from '#src/server/common/helpers/marine-licence/marine-plan-policy-wait.js'

export const CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/calculate-marine-plan-policies-and-wait/index'

const WAIT_TIMEOUT_MS = 50_000

export const calculateMarinePlanPoliciesAndWaitController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!marineLicence?.id) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const marineLicenceService = getMarineLicenceService(request)
    const { marinePlanPolicyJob } =
      await marineLicenceService.getMarineLicenceById(marineLicence.id)

    const startedAt = getMarinePlanPolicyQueryStartTime(request)

    const isJobComplete =
      marinePlanPolicyJob === 'ready' || marinePlanPolicyJob === 'failed'

    const hasTimedOut = startedAt && Date.now() - startedAt >= WAIT_TIMEOUT_MS

    if (isJobComplete || hasTimedOut) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const startedAt = getMarinePlanPolicyQueryStartTime(request)
    if (startedAt && Date.now() - startedAt >= WAIT_TIMEOUT_MS) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    return h.view(CALCULATE_MARINE_PLAN_POLICIES_AND_WAIT_VIEW_ROUTE, {
      pageTitle: 'Loading your Marine plan policies',
      heading: 'Loading your Marine plan policies',
      pageRefreshTimeInMs: 2000
    })
  }
}
