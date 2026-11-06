import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { DOCUMENT_ACCEPT_ATTRIBUTE } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/constants.js'
import { handleSupportingDocumentUploadStatus } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/upload-status.js'
import {
  getMarinePlanPolicyDocumentTypeUrl,
  getMarinePlanPolicySupportingDocumentUploadErrorDisplay,
  initiateMarinePlanPolicySupportingDocumentUpload,
  persistSupportingDocument
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/utils.js'

export const MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/index'

const PAGE_TITLE = 'Upload a supporting document'

const policiesUrl = marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES

export const marinePlanPolicySupportingDocumentController = {
  async handler(request, h) {
    const { errorSummary, errors } =
      getMarinePlanPolicySupportingDocumentUploadErrorDisplay(request)

    try {
      const { uploadUrl } =
        await initiateMarinePlanPolicySupportingDocumentUpload(request, h)

      return h.view(MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE, {
        pageTitle: PAGE_TITLE,
        heading: PAGE_TITLE,
        projectName: getMarineLicenceCache(request).projectName,
        uploadUrl,
        acceptAttribute: DOCUMENT_ACCEPT_ATTRIBUTE,
        backLink: policiesUrl,
        cancelLink: policiesUrl,
        errorSummary,
        errors
      })
    } catch (error) {
      request.logger.error(
        { err: error },
        'Failed to initialise marine plan policy supporting document upload'
      )
      return h.redirect(policiesUrl)
    }
  }
}

export const marinePlanPolicySupportingDocumentUploadAndWaitController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return handleSupportingDocumentUploadStatus(request, h, {
      marineLicence,
      persistDocument: (status) =>
        persistSupportingDocument(request, marineLicence.id, status),
      buildReturnUrl: getMarinePlanPolicyDocumentTypeUrl,
      noUploadUrl: policiesUrl
    })
  }
}
