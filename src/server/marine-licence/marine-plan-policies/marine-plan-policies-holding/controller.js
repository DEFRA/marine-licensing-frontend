import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'

export const MARINE_PLAN_POLICIES_HOLDING_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policies-holding/index'

const HEADING = 'Marine plan policies'

export const marinePlanPoliciesHoldingController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!marineLicence?.id) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const marineLicenceService = getMarineLicenceService(request)
    const { marinePlanPolicyJob, projectName } =
      await marineLicenceService.getMarineLicenceById(marineLicence.id)

    if (marinePlanPolicyJob === 'ready') {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES)
    }

    if (marinePlanPolicyJob === 'failed') {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    return h.view(MARINE_PLAN_POLICIES_HOLDING_VIEW_ROUTE, {
      pageTitle: HEADING,
      heading: HEADING,
      projectName,
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      refreshLink:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_HOLDING
    })
  }
}
