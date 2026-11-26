import Boom from '@hapi/boom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getValidatedReferrerPath } from '#src/server/common/helpers/referrer-validation.js'
import { buildMarinePlanPolicyDocumentsData } from '#src/server/common/helpers/marine-licence/marine-plan-policy-documents-data.js'
import { outstandingPoliciesText } from '#src/server/common/helpers/marine-licence/marine-plan-policy-sections.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

export const MARINE_PLAN_POLICY_DOCUMENTS_REVIEW_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-documents-review/index'

const PAGE_TITLE = 'Supporting documents'

const POLICIES_URL = marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES

const withCardAnchor = (path) => (path ? `${path}#document-card-1` : undefined)

const getCompletedReturnTo = (returnTo, supportingDocuments) =>
  supportingDocuments?.documentsOutstanding?.length ? undefined : returnTo

export const marinePlanPolicyDocumentsReviewController = {
  async handler(request, h) {
    const cached = getMarineLicenceCache(request)

    if (!cached?.id) {
      throw Boom.notFound('Marine licence not found')
    }

    const marineLicenceService = getMarineLicenceService(request)

    const marineLicence = await marineLicenceService.getMarineLicenceById(
      cached.id
    )
    const { projectName, marinePlanPolicySupportingDocuments } = marineLicence

    const returnTo = request.yar?.get(RETURN_TO_CACHE_KEY)
    const completedReturnTo = getCompletedReturnTo(
      returnTo,
      marinePlanPolicySupportingDocuments
    )

    if (!marinePlanPolicySupportingDocuments?.linkedDocuments?.length) {
      return h.redirect(completedReturnTo ?? POLICIES_URL)
    }

    return h.view(MARINE_PLAN_POLICY_DOCUMENTS_REVIEW_VIEW_ROUTE, {
      pageTitle: PAGE_TITLE,
      heading: PAGE_TITLE,
      projectName,
      backLink:
        withCardAnchor(returnTo) ??
        getValidatedReferrerPath(request.headers?.referer) ??
        POLICIES_URL,
      continueLink: withCardAnchor(completedReturnTo) ?? POLICIES_URL,
      documents: buildMarinePlanPolicyDocumentsData(marineLicence),
      newUploadLink:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
      outstandingPoliciesText: outstandingPoliciesText(
        marinePlanPolicySupportingDocuments.documentsOutstanding
      )
    })
  }
}
