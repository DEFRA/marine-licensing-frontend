import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  marineLicenceRoutes,
  apiRoutes
} from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'

export const MARINE_PLAN_POLICY_UNLINK_SUPPORTING_DOCUMENTS_VIEW_ROUTE =
  'marine-licence/marine-plan-policy-unlink-supporting-documents/index'

const PAGE_TITLE = 'Your consideration no longer refers to a document'

export const marinePlanPolicyUnlinkSupportingDocumentsController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { policyCode } = request.params

    return h.view(MARINE_PLAN_POLICY_UNLINK_SUPPORTING_DOCUMENTS_VIEW_ROUTE, {
      pageTitle: PAGE_TITLE,
      heading: PAGE_TITLE,
      projectName: marineLicence.projectName,
      backLink: getMarinePlanPolicyLink(policyCode),
      cancelLink: getMarinePlanPolicyLink(policyCode)
    })
  }
}

export const marinePlanPolicyUnlinkSupportingDocumentsSubmitController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { policyCode } = request.params
    const { id } = marineLicence

    await authenticatedPatchRequest(
      request,
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_RESPONSE,
      {
        id,
        policyCode,
        requiresDocumentation: false
      }
    )

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES)
  }
}
