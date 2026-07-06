import Boom from '@hapi/boom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'

export const MARINE_PLAN_POLICIES_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/index'

const HEADING = 'Marine plan policies'

const isCompleted = (responses, policyCode) => {
  const response = responses?.[policyCode]
  return typeof response === 'string' && response.trim().length > 0
}

const toPolicyRow = (responses) => (policy) => ({
  title: { text: policy.policyCode },
  href: getMarinePlanPolicyLink(policy.policyCode),
  status: isCompleted(responses, policy.policyCode)
    ? { text: 'Completed' }
    : { tag: { text: 'Not yet started', classes: 'govuk-tag--blue' } }
})

const countCompleted = (policies, responses) =>
  policies.filter((policy) => isCompleted(responses, policy.policyCode)).length

const sortByPolicyCode = (policies) =>
  [...policies].sort((a, b) => a.policyCode.localeCompare(b.policyCode))

const buildPoliciesCountText = (total, completed) => {
  if (completed > 0) {
    return `${completed} of ${total} policies completed`
  }

  return total === 1 ? '1 policy to complete' : `${total} policies to complete`
}

export const marinePlanPoliciesController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!marineLicence?.id) {
      throw Boom.notFound('Marine licence not found')
    }

    const marineLicenceService = getMarineLicenceService(request)
    const {
      projectName,
      marinePlanPolicies,
      marinePlanPoliciesCount,
      marinePlanPolicyResponses
    } = await marineLicenceService.getMarineLicenceById(marineLicence.id)

    const sortedPolicies = sortByPolicyCode(marinePlanPolicies ?? [])
    const policies = sortedPolicies.map(toPolicyRow(marinePlanPolicyResponses))
    const completedCount = countCompleted(
      sortedPolicies,
      marinePlanPolicyResponses
    )

    return h.view(MARINE_PLAN_POLICIES_VIEW_ROUTE, {
      pageTitle: HEADING,
      heading: HEADING,
      projectName,
      policiesCountText: buildPoliciesCountText(
        marinePlanPoliciesCount,
        completedCount
      ),
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      taskListLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      policies
    })
  }
}
