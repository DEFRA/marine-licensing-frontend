import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'
import { sortByPolicyCode } from '#src/server/common/helpers/marine-licence/sort-by-policy-code.js'

export const buildMarinePlanPoliciesData = (marineLicence) => {
  const policies = marineLicence?.marinePlanPolicies ?? []
  const responses = marineLicence?.marinePlanPolicyResponses ?? {}

  return sortByPolicyCode(policies).map((policy) => ({
    policyCode: policy.policyCode,
    wording: policy.policy ?? '',
    response: responses[policy.policyCode] ?? '',
    changeHref: getMarinePlanPolicyLink(policy.policyCode)
  }))
}
