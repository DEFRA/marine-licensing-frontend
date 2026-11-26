import {
  MPP_DOCUMENT_TYPES,
  MPP_DOCUMENT_TYPE_OTHER
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/constants.js'
import { formatPolicyTitle } from '#src/server/common/helpers/marine-licence/marine-plan-policy-title.js'
import {
  getMarinePlanPolicyDeleteSupportingDocumentUrl,
  getMarinePlanPolicyDocumentPolicyUrl,
  getMarinePlanPolicyDocumentTypeUrl
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/utils.js'

const getPolicyTitle = (policies, policyCode) => {
  const policy = policies.find((item) => item.policyCode === policyCode)
  return policy ? formatPolicyTitle(policy) : policyCode
}

export const buildMarinePlanPolicyDocumentsData = (marineLicence) => {
  const documents =
    marineLicence?.marinePlanPolicySupportingDocuments?.linkedDocuments ?? []
  const policies = marineLicence?.marinePlanPolicies ?? []

  return documents.map((document) => ({
    filename: document.uploadedFile.filename,
    type: MPP_DOCUMENT_TYPES[document.documentType] ?? '',
    typeOther:
      document.documentType === MPP_DOCUMENT_TYPE_OTHER
        ? document.documentTypeOther
        : '',
    policies: (document.policyLinks ?? []).map((link) => ({
      title: getPolicyTitle(policies, link.policyCode),
      location: link.location
    })),
    deleteHref: getMarinePlanPolicyDeleteSupportingDocumentUrl(
      document.documentId
    ),
    changeTypeHref: `${getMarinePlanPolicyDocumentTypeUrl(document.documentId)}?action=change`,
    changePoliciesHref: `${getMarinePlanPolicyDocumentPolicyUrl(document.documentId)}?action=change`
  }))
}
