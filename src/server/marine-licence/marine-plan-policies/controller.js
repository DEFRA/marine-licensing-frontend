import Boom from '@hapi/boom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'

export const MARINE_PLAN_POLICIES_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/index'

const HEADING = 'Marine plan policies'

const toPolicyRow = (policy) => ({
  title: { text: policy.policyCode },
  status: { tag: { text: 'Not yet started', classes: 'govuk-tag--blue' } }
})

const sortByPolicyCode = (policies) =>
  [...policies].sort((a, b) => a.policyCode.localeCompare(b.policyCode))

export const marinePlanPoliciesController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!marineLicence?.id) {
      throw Boom.notFound('Marine licence not found')
    }

    const marineLicenceService = getMarineLicenceService(request)
    const { projectName, marinePlanPolicies, marinePlanPoliciesCount } =
      await marineLicenceService.getMarineLicenceById(marineLicence.id)

    const policies = sortByPolicyCode(marinePlanPolicies ?? []).map(toPolicyRow)

    return h.view(MARINE_PLAN_POLICIES_VIEW_ROUTE, {
      pageTitle: HEADING,
      heading: HEADING,
      projectName,
      marinePlanPoliciesCount,
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      taskListLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      policies
    })
  }
}
