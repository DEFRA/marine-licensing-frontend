import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'

const sortByPolicyCode = (policies) =>
  [...policies].sort((a, b) => a.policyCode.localeCompare(b.policyCode))

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
