import { sortByPolicyCode } from '#src/server/common/helpers/marine-licence/sort-by-policy-code.js'

export const UNCATEGORISED_SECTION = 'Other'

export const getPolicySection = ({ category }) =>
  (typeof category === 'string' ? category.trim() : '') || UNCATEGORISED_SECTION

export const getPolicySectionSlug = (section) =>
  section
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')

export const getPolicySectionCardId = (slug) =>
  `marine-plan-policies-card-${slug}`

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

  return [...bySection.keys()].sort(compareSections).map((heading) => ({
    heading,
    slug: getPolicySectionSlug(heading),
    policies: bySection.get(heading)
  }))
}
