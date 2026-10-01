import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'
import { groupPoliciesBySection } from '#src/server/common/helpers/marine-licence/marine-plan-policy-sections.js'
import { formatPolicyTitle } from '#src/server/common/helpers/marine-licence/marine-plan-policy-title.js'

export const buildMarinePlanPoliciesData = (marineLicence) => {
  const policies = marineLicence?.marinePlanPolicies ?? []
  const responses = marineLicence?.marinePlanPolicyResponses ?? {}

  return groupPoliciesBySection(policies).map(
    ({ policies: sectionPolicies, ...section }) => ({
      ...section,
      policies: sectionPolicies.map((policy) => ({
        policyCode: policy.policyCode,
        displayTitle: formatPolicyTitle(policy),
        wording: policy.policy ?? '',
        response: responses[policy.policyCode] ?? '',
        changeHref: getMarinePlanPolicyLink(policy.policyCode)
      }))
    })
  )
}
