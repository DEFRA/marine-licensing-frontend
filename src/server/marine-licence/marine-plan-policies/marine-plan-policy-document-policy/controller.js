import Boom from '@hapi/boom'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'

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
  const marineLicence = getMarineLicenceCache(request)

  if (!marineLicence?.id) {
    throw Boom.notFound('Marine licence not found')
  }

  const { id } = marineLicence
  const { documentId } = request.params
  const marineLicenceFromServer =
    await getMarineLicenceService(request).getMarineLicenceById(id)

  const { marinePlanPolicySupportingDocuments, marinePlanPolicies } =
    marineLicenceFromServer
  const document = marinePlanPolicySupportingDocuments?.documents?.find(
    (item) => item.documentId === documentId
  )

  if (!document) {
    throw Boom.notFound('Marine plan policy supporting document not found')
  }

  const { requiringDocuments } = marinePlanPolicySupportingDocuments

  return {
    id,
    documentId,
    requiringDocuments,
    marinePlanPolicies,
    filename: document.uploadedFile?.filename,
    policyLinks: document.policyLinks
  }
}

const documentPolicyUrl = (documentId) =>
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_POLICY.replace(
    '{documentId}',
    documentId
  )

const documentTypeUrl = (documentId) =>
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE.replace(
    '{documentId}',
    documentId
  )

const buildView = ({
  documentId,
  requiringDocuments,
  marinePlanPolicies,
  filename,
  payload,
  errors,
  errorSummary
}) => ({
  pageTitle: PAGE_TITLE,
  heading: PAGE_TITLE,
  filename,
  options: getPolicyOptions(requiringDocuments, marinePlanPolicies),
  backLink: documentTypeUrl(documentId),
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

    return h.redirect(documentPolicyUrl(documentId))
  }
}
