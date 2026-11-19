import Boom from '@hapi/boom'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { loadMarinePlanPolicyDocument } from '#src/server/marine-licence/marine-plan-policies/document-utils.js'
import { policyCodeList } from '#src/server/common/helpers/marine-licence/marine-plan-policy-sections.js'
import { marinePlanPolicyDocumentPolicyParamsSchema } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-policy/schema.js'

export const MARINE_PLAN_POLICY_DELETE_SUPPORTING_DOCUMENT_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-delete-supporting-document/index'

const PAGE_TITLE = 'Are you sure you want to delete this document?'

const reviewUrl =
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW

const hasOtherDocuments = (marineLicence, documentId) =>
  marineLicence.marinePlanPolicySupportingDocuments.linkedDocuments.some(
    (document) => document.documentId !== documentId
  )

const getPolicyText = (document) => {
  const policyCodes = document.policyLinks?.map((link) => link.policyCode) ?? []

  return policyCodes.length
    ? `It will no longer support ${policyCodeList.format(policyCodes)}`
    : ''
}

const options = {
  validate: {
    params: marinePlanPolicyDocumentPolicyParamsSchema
  }
}

export const marinePlanPolicyDeleteSupportingDocumentController = {
  options,
  async handler(request, h) {
    const { projectName, document } =
      await loadMarinePlanPolicyDocument(request)

    return h.view(MARINE_PLAN_POLICY_DELETE_SUPPORTING_DOCUMENT_VIEW_ROUTE, {
      projectName,
      filename: document.uploadedFile.filename,
      pageTitle: PAGE_TITLE,
      heading: PAGE_TITLE,
      noLongerSupportsText: getPolicyText(document),
      backLink: reviewUrl,
      cancelLink: reviewUrl
    })
  }
}

export const marinePlanPolicyDeleteSupportingDocumentSubmitController = {
  options,
  async handler(request, h) {
    const { id, documentId, marineLicence } =
      await loadMarinePlanPolicyDocument(request)

    try {
      await authenticatedPatchRequest(
        request,
        apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DELETE_DOCUMENT,
        { id, documentId }
      )
    } catch (error) {
      request.logger.error(
        {
          event: {
            action: 'marine-licence:delete-marine-plan-policy-document-failed',
            reference: id,
            reason: `documentId=${documentId}`
          }
        },
        'Error deleting marine plan policy supporting document'
      )
      throw Boom.internal(
        'Error deleting marine plan policy supporting document'
      )
    }

    return h.redirect(
      hasOtherDocuments(marineLicence, documentId)
        ? reviewUrl
        : marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  }
}
