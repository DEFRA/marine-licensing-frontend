import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'
import {
  getPolicyTitle,
  groupPoliciesBySection
} from '#src/server/common/helpers/marine-licence/marine-plan-policy-sections.js'

export const buildMarinePlanPoliciesData = (marineLicence) => {
  const policies = marineLicence?.marinePlanPolicies ?? []
  const responses = marineLicence?.marinePlanPolicyResponses ?? {}

  return groupPoliciesBySection(policies).map(({ policies, ...section }) => ({
    ...section,
    policies: policies.map((policy) => ({
      policyCode: policy.policyCode,
      title: getPolicyTitle(policy),
      wording: policy.policy ?? '',
      response: responses[policy.policyCode] ?? '',
      changeHref: getMarinePlanPolicyLink(policy.policyCode)
    }))
  }))
}
