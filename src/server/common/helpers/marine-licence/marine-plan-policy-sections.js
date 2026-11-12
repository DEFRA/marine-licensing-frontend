import { sortByPolicyCode } from '#src/server/common/helpers/marine-licence/sort-by-policy-code.js'
import {
  getMarinePlanPolicyTagStyle,
  MARINE_PLAN_POLICY_STATUS
} from '../../constants/marine-plan-policies.js'
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

const policyCodeList = new Intl.ListFormat('en-GB', { type: 'conjunction' })

const toKnownStatus = (status) =>
  Object.hasOwn(MARINE_PLAN_POLICY_STATUS, status) ? status : 'INCOMPLETE'

const getSupportingDocumentsStatus = (status, documents) => {
  const knownStatus = toKnownStatus(status)
  return knownStatus === 'INCOMPLETE' && documents?.length
    ? 'IN_PROGRESS'
    : knownStatus
}

const getSupportingDocumentsStatusItem = (status) =>
  status === 'COMPLETED'
    ? { text: MARINE_PLAN_POLICY_STATUS.COMPLETED }
    : {
        classes: 'govuk-task-list__status--nowrap',
        tag: {
          text: MARINE_PLAN_POLICY_STATUS[status],
          classes: getMarinePlanPolicyTagStyle(status)
        }
      }

export const addSupportingDocumentsSection = ({
  documents,
  documentsOutstanding,
  status
}) => ({
  heading: 'Supporting documents',
  items: [
    {
      title: {
        text: 'Upload supporting documents',
        classes: 'govuk-link--no-visited-state'
      },
      hint: {
        text: documentsOutstanding?.length
          ? `Still needed for ${policyCodeList.format(documentsOutstanding)}`
          : ''
      },
      href: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
      status: getSupportingDocumentsStatusItem(
        getSupportingDocumentsStatus(status, documents)
      )
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
