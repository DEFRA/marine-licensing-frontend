import { sortByPolicyCode } from '#src/server/common/helpers/marine-licence/sort-by-policy-code.js'
import {
  getMarinePlanPolicyTagStyle,
  MARINE_PLAN_POLICY_STATUS
} from '../../constants/marin-plan-policies.js'
import { marineLicenceRoutes } from '../../constants/routes.js'

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

const stillNeededText = (requiredPolicyCodes) => {
  let formattedText = ``

  requiredPolicyCodes.forEach((policy, index) => {
    formattedText += policy
    if (index !== requiredPolicyCodes.length - 1) {
      formattedText += ' and '
    }
  })

  return formattedText
}

export const addSupportingDocumentsSection = ({ required, status }) => ({
  heading: 'Supporting documents',
  items: [
    {
      title: {
        text: 'Upload supporting documents',
        classes: 'govuk-link--no-visited-state'
      },
      hint: {
        text: required?.length
          ? `Still needed for ${stillNeededText(required)}`
          : ''
      },
      href: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
      status:
        status === 'COMPLETED'
          ? { text: MARINE_PLAN_POLICY_STATUS.COMPLETED }
          : {
              classes: 'govuk-task-list__status--nowrap',
              tag: {
                text: MARINE_PLAN_POLICY_STATUS[status],
                classes: getMarinePlanPolicyTagStyle(status)
              }
            }
    }
  ]
})

export const groupPoliciesBySection = (policies) => {
  const bySection = Map.groupBy(sortByPolicyCode(policies), getPolicySection)

  return [...bySection.keys()].sort(compareSections).map((heading) => ({
    heading,
    slug: getPolicySectionSlug(heading),
    policies: bySection.get(heading)
  }))
}
