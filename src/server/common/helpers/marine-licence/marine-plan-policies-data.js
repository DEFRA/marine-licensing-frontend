import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'
import {
  getPolicySectionCardId,
  groupPoliciesBySection
} from '#src/server/common/helpers/marine-licence/marine-plan-policy-sections.js'
import { formatPolicyTitle } from '#src/server/common/helpers/marine-licence/marine-plan-policy-title.js'
import {
  getDocumentsForPolicy,
  getFormattedLinkedPolicies
} from '#src/server/marine-licence/marine-plan-policies/document-utils.js'

const getSupportingDocuments = (marineLicence, policyCode) => {
  const associatedDocuments = getDocumentsForPolicy(marineLicence, policyCode)
  return getFormattedLinkedPolicies(associatedDocuments, policyCode)
}

export const buildMarinePlanPoliciesData = (marineLicence) => {
  const policies = marineLicence?.marinePlanPolicies ?? []
  const responses = marineLicence?.marinePlanPolicyResponses ?? {}

  return groupPoliciesBySection(policies).map(
    ({ policies: sectionPolicies, ...section }) => ({
      ...section,
      cardId: getPolicySectionCardId(section.slug),
      policies: sectionPolicies.map((policy) => ({
        policyCode: policy.policyCode,
        displayTitle: formatPolicyTitle(policy),
        wording: policy.policy ?? '',
        response: responses[policy.policyCode]?.response ?? '',
        changeHref: getMarinePlanPolicyLink(policy.policyCode),
        supportingDocuments: getSupportingDocuments(
          marineLicence,
          policy.policyCode
        )
      }))
    })
  )
}
