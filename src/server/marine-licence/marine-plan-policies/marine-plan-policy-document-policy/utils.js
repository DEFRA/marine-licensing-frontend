import { formatPolicyTitle } from '#src/server/common/helpers/marine-licence/marine-plan-policy-title.js'

export const getPolicyOptions = (documentsOutstanding, policies) =>
  documentsOutstanding.map((code) => ({
    value: code,
    text: formatPolicyTitle(
      policies.find((policy) => policy.policyCode === code)
    )
  }))
