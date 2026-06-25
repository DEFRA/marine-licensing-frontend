import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'

export const MARINE_PLAN_POLICY_QUERY_SPINNER_VIEW_ROUTE =
  'marine-licence/site-details/marine-plan-policy-query-spinner/index'

export const marinePlanPolicyQuerySpinnerController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!marineLicence?.id) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const marineLicenceService = getMarineLicenceService(request)
    const { marinePlanPolicyJob } =
      await marineLicenceService.getMarineLicenceById(marineLicence.id)

    if (marinePlanPolicyJob === 'ready' || marinePlanPolicyJob === 'failed') {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    return h.view(MARINE_PLAN_POLICY_QUERY_SPINNER_VIEW_ROUTE, {
      pageTitle: 'Calculating marine plan policies',
      heading: 'Calculating marine plan policies',
      pageRefreshTimeInSeconds: 2,
      isProcessing: true
    })
  }
}
