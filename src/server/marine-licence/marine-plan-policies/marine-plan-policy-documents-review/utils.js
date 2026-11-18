import { MPP_DOCUMENT_TYPES } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/constants.js'
import { formatPolicyTitle } from '#src/server/common/helpers/marine-licence/marine-plan-policy-title.js'
import escapeHtml from 'lodash/escape.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const outputType = (document) => {
  const { documentType } = document

  let output = MPP_DOCUMENT_TYPES[documentType] ?? ''

  if (documentType === 'other') {
    output += `<br>${escapeHtml(document.documentTypeOther)}`
  }

  return output
}

const outputPolicyTitle = (policies, policyCode) => {
  const policy = policies.find((item) => item.policyCode === policyCode)
  return escapeHtml(policy ? formatPolicyTitle(policy) : policyCode)
}

const outputPolicies = (document, policies) => {
  const { policyLinks = [] } = document

  if (!policyLinks.length) {
    return ''
  }

  const policyList = policyLinks.map(
    (link) =>
      `<li>${outputPolicyTitle(policies, link.policyCode)} - ${escapeHtml(link.location)}</li>`
  )

  return `<ul class="govuk-list govuk-list--bullet govuk-!-margin-bottom-0">${policyList.join('')}</ul>`
}

export const createDocumentCards = (
  marinePlanPolicySupportingDocuments,
  marinePlanPolicies
) => {
  const { documents = [] } = marinePlanPolicySupportingDocuments

  const cards = documents.map((document) => ({
    title: document.uploadedFile.filename,
    actions: {
      items: [
        {
          href: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DELETE_SUPPORTING_DOCUMENT.replace(
            '{documentId}',
            encodeURIComponent(document.documentId)
          ),
          text: 'Delete',
          visuallyHiddenText: 'document',
          classes: 'govuk-link--no-visited-state'
        }
      ]
    },
    rows: [
      {
        key: {
          text: 'Type'
        },
        value: {
          html: outputType(document)
        },
        actions: {
          items: [
            {
              href: `${marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE.replace(
                '{documentId}',
                encodeURIComponent(document.documentId)
              )}?action=change`,
              text: 'Change',
              visuallyHiddenText: 'type',
              classes: 'govuk-link--no-visited-state'
            }
          ]
        }
      },
      {
        key: {
          text: 'Policies'
        },
        value: {
          html: outputPolicies(document, marinePlanPolicies)
        },
        actions: {
          items: [
            {
              href: `${marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_POLICY.replace(
                '{documentId}',
                encodeURIComponent(document.documentId)
              )}?action=change`,
              text: 'Change',
              visuallyHiddenText: 'policies'
            }
          ]
        }
      }
    ]
  }))

  return cards
}
