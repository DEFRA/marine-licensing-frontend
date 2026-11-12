import { formatPolicyTitle } from '#src/server/common/helpers/marine-licence/marine-plan-policy-title.js'

export const getPolicyOptions = (requiringDocuments, policies) =>
  requiringDocuments.map((code) => ({
    value: code,
    text: formatPolicyTitle(
      policies.find((policy) => policy.policyCode === code)
    )
  }))

export const getPolicyLinksPayload = (policyLinks = []) =>
  Object.fromEntries([
    ['supportedPolicies', policyLinks.map(({ policyCode }) => policyCode)],
    ...policyLinks.map(({ policyCode, location }) => [
      `location-${policyCode}`,
      location
    ])
  ])

export const getPolicyLinks = ({ supportedPolicies, ...locations }) =>
  supportedPolicies.map((policyCode) => ({
    policyCode,
    location: locations[`location-${policyCode}`]
  }))
