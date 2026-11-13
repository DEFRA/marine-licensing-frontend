import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { loadMarinePlanPolicyDocument } from '#src/server/marine-licence/marine-plan-policies/document-utils.js'
import { getMarinePlanPolicyDocumentTypeUrl } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/utils.js'

import {
  MPP_DOCUMENT_LOCATION_MAX_LENGTH,
  marinePlanPolicyDocumentPolicyParamsSchema,
  marinePlanPolicyDocumentPolicySchema
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-policy/schema.js'
import {
  getPolicyLinks,
  getPolicyLinksPayload,
  getPolicyOptions
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-policy/utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

export const MARINE_PLAN_POLICY_DOCUMENT_POLICY_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-document-policy/index'

const PAGE_TITLE = 'Which policies does this document support?'

export const errorMessages = {
  POLICY_LINKS_REQUIRED: 'Select the policies this document supports',
  DOCUMENT_LOCATION_REQUIRED: 'Enter where the information is in this document',
  DOCUMENT_LOCATION_MAX_LENGTH: `The location of the information in the document must be ${MPP_DOCUMENT_LOCATION_MAX_LENGTH} characters or fewer`
}

const loadDocumentContext = async (request) => {
  const { id, documentId, projectName, document, marineLicence } =
    await loadMarinePlanPolicyDocument(request)

  return {
    id,
    documentId,
    projectName,
    requiringDocuments:
      marineLicence.marinePlanPolicySupportingDocuments.requiringDocuments,
    marinePlanPolicies: marineLicence.marinePlanPolicies,
    filename: document.uploadedFile?.filename,
    policyLinks: document.policyLinks
  }
}

const buildView = ({
  documentId,
  projectName,
  requiringDocuments,
  marinePlanPolicies,
  filename,
  payload,
  errors,
  errorSummary
}) => ({
  pageTitle: PAGE_TITLE,
  heading: PAGE_TITLE,
  projectName,
  filename,
  options: getPolicyOptions(requiringDocuments, marinePlanPolicies),
  backLink: getMarinePlanPolicyDocumentTypeUrl(documentId),
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
  payload,
  errors,
  errorSummary
})

export const marinePlanPolicyDocumentPolicyController = {
  options: {
    validate: {
      params: marinePlanPolicyDocumentPolicyParamsSchema
    }
  },
  async handler(request, h) {
    const context = await loadDocumentContext(request)

    if (!context.requiringDocuments.length) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES)
    }

    return h.view(
      MARINE_PLAN_POLICY_DOCUMENT_POLICY_VIEW_ROUTE,
      buildView({
        ...context,
        payload: getPolicyLinksPayload(context.policyLinks)
      })
    )
  }
}

export const marinePlanPolicyDocumentPolicySubmitController = {
  options: {
    validate: {
      params: marinePlanPolicyDocumentPolicyParamsSchema,
      payload: marinePlanPolicyDocumentPolicySchema,
      failAction: async (request, h, err) => {
        const context = await loadDocumentContext(request)

        if (!context.requiringDocuments.length) {
          return h
            .redirect(marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES)
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(
          err.details ?? [],
          errorMessages
        )

        return h
          .view(
            MARINE_PLAN_POLICY_DOCUMENT_POLICY_VIEW_ROUTE,
            buildView({
              ...context,
              payload: request.payload,
              errors: errorDescriptionByFieldName(errorSummary),
              errorSummary
            })
          )
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { documentId, id } = await loadDocumentContext(request)

    await authenticatedPatchRequest(
      request,
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_LINKS,
      { id, documentId, policyLinks: getPolicyLinks(request.payload) }
    )

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW
    )
  }
}
