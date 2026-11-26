import Boom from '@hapi/boom'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  marineLicenceRoutes,
  apiRoutes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { formatPolicyTitle } from '#src/server/common/helpers/marine-licence/marine-plan-policy-title.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'
import {
  clearPendingUnlink,
  getPendingUnlink
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-unlink-supporting-documents/pending-unlink.js'

export const MARINE_PLAN_POLICY_UNLINK_SUPPORTING_DOCUMENTS_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-unlink-supporting-documents/index'

const PAGE_TITLE = 'Your consideration no longer refers to a document'

export const marinePlanPolicyUnlinkSupportingDocumentsController = {
  async handler(request, h) {
    const { policyCode } = request.params
    const pendingUnlink = getPendingUnlink(request, policyCode)

    if (!pendingUnlink) {
      return h.redirect(getMarinePlanPolicyLink(policyCode))
    }

    const { id } = getMarineLicenceCache(request)

    const marineLicenceService = getMarineLicenceService(request)

    const { projectName, marinePlanPolicies } =
      await marineLicenceService.getMarineLicenceById(id)

    const policy = (marinePlanPolicies ?? []).find(
      (item) => item.policyCode === policyCode
    )

    if (!policy) {
      throw Boom.notFound('Marine plan policy not found')
    }

    return h.view(MARINE_PLAN_POLICY_UNLINK_SUPPORTING_DOCUMENTS_VIEW_ROUTE, {
      pageTitle: PAGE_TITLE,
      heading: PAGE_TITLE,
      projectName,
      policyTitle: formatPolicyTitle(policy),
      filenames: pendingUnlink.filenames,
      backLink: getMarinePlanPolicyLink(policyCode),
      cancelLink: getMarinePlanPolicyLink(policyCode)
    })
  }
}

export const marinePlanPolicyUnlinkSupportingDocumentsSubmitController = {
  async handler(request, h) {
    const { policyCode } = request.params
    const pendingUnlink = getPendingUnlink(request, policyCode)
    clearPendingUnlink(request)

    if (!pendingUnlink) {
      return h.redirect(getMarinePlanPolicyLink(policyCode))
    }

    await authenticatedPatchRequest(
      request,
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_RESPONSE,
      { ...pendingUnlink.body, confirmDocumentDeletion: true }
    )

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES)
  }
}
