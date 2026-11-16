import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { loadMarinePlanPolicyDocument } from '#src/server/marine-licence/marine-plan-policies/document-utils.js'
import { getMarinePlanPolicyDocumentPolicyUrl } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/utils.js'
import {
  MPP_DOCUMENT_TYPE_OTHER_MAX_LENGTH,
  MPP_DOCUMENT_TYPES
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/constants.js'
import {
  marinePlanPolicyDocumentTypeParamsSchema,
  marinePlanPolicyDocumentTypeSchema
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/schema.js'

export const MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-document-type/index'

const PAGE_TITLE = 'What type of document is this?'

const SELECT_TYPE_MESSAGE = 'Select the type of document'

export const errorMessages = {
  DOCUMENT_TYPE_REQUIRED: SELECT_TYPE_MESSAGE,
  DOCUMENT_ID_INVALID: SELECT_TYPE_MESSAGE,
  DOCUMENT_ID_REQUIRED: SELECT_TYPE_MESSAGE,
  DOCUMENT_TYPE_OTHER_REQUIRED: 'Enter a description of the document',
  DOCUMENT_TYPE_OTHER_MAX_LENGTH: `Description of the document must be ${MPP_DOCUMENT_TYPE_OTHER_MAX_LENGTH} characters or fewer`
}

const buildView = ({ projectName, payload, errors, errorSummary }) => ({
  pageTitle: PAGE_TITLE,
  heading: PAGE_TITLE,
  projectName,
  documentTypes: MPP_DOCUMENT_TYPES,
  backLink:
    marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
  payload,
  errors,
  errorSummary
})

export const marinePlanPolicyDocumentTypeController = {
  options: {
    validate: {
      params: marinePlanPolicyDocumentTypeParamsSchema
    }
  },
  async handler(request, h) {
    const { projectName, document } =
      await loadMarinePlanPolicyDocument(request)

    return h.view(
      MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE,
      buildView({
        projectName,
        payload: {
          documentType: document.documentType,
          documentTypeOther: document.documentTypeOther
        }
      })
    )
  }
}

export const marinePlanPolicyDocumentTypeSubmitController = {
  options: {
    validate: {
      params: marinePlanPolicyDocumentTypeParamsSchema,
      payload: marinePlanPolicyDocumentTypeSchema,
      failAction: async (request, h, err) => {
        const { projectName } = await loadMarinePlanPolicyDocument(request)
        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        return h
          .view(
            MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE,
            buildView({
              projectName,
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
    const { id, documentId } = await loadMarinePlanPolicyDocument(request)
    const { documentType, documentTypeOther } = request.payload

    await authenticatedPatchRequest(
      request,
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE,
      { id, documentId, documentType, documentTypeOther }
    )

    return h.redirect(getMarinePlanPolicyDocumentPolicyUrl(documentId))
  }
}
