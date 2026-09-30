import { sortByPolicyCode } from '#src/server/common/helpers/marine-licence/sort-by-policy-code.js'

export const UNCATEGORISED_SECTION = 'Other'

const trimmedString = (value) => (typeof value === 'string' ? value.trim() : '')

// Until the policies API is populated, title is often just the code repeated.
export const getPolicyTitle = ({ title, policyCode }) => {
  const trimmed = trimmedString(title)
  return trimmed && trimmed !== policyCode ? trimmed : null
}

export const formatPolicyTitle = (policy) => {
  const title = getPolicyTitle(policy)
  return title ? `${title} (${policy.policyCode})` : policy.policyCode
}

export const getPolicySection = ({ category }) =>
  trimmedString(category) || UNCATEGORISED_SECTION

export const getPolicySectionSlug = (section) =>
  section.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')

const compareSections = (a, b) => {
  if (a === UNCATEGORISED_SECTION) {
    return 1
  }
  if (b === UNCATEGORISED_SECTION) {
    return -1
  }
  return a.localeCompare(b)
}

export const groupPoliciesBySection = (policies) => {
  const bySection = Map.groupBy(sortByPolicyCode(policies), getPolicySection)

  return [...bySection.keys()].sort(compareSections).map((section) => ({
    section,
    slug: getPolicySectionSlug(section),
    policies: bySection.get(section)
  }))
}
