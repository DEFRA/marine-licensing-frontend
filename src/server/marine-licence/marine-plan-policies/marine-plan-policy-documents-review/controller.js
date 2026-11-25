import Boom from '@hapi/boom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getValidatedReferrerPath } from '#src/server/common/helpers/referrer-validation.js'
import { buildMarinePlanPolicyDocumentsData } from '#src/server/common/helpers/marine-licence/marine-plan-policy-documents-data.js'
import { outstandingPoliciesText } from '#src/server/common/helpers/marine-licence/marine-plan-policy-sections.js'
import { setReturnToCache } from '#src/server/common/helpers/marine-licence/session-cache/return-to-cache.js'
import { isFromCheckYourAnswers } from '#src/server/common/helpers/marine-licence/redirect-link.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

export const MARINE_PLAN_POLICY_DOCUMENTS_REVIEW_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-documents-review/index'

const PAGE_TITLE = 'Supporting documents'

const getReturnLink = async (request, h) => {
  if (isFromCheckYourAnswers(request)) {
    await setReturnToCache(
      request,
      h,
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )
  }

  const returnTo = request.yar?.get(RETURN_TO_CACHE_KEY)

  return returnTo ? `${returnTo}#document-card-1` : undefined
}

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

    if (!marinePlanPolicySupportingDocuments?.linkedDocuments?.length) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES)
    }

    const returnLink = await getReturnLink(request, h)

    return h.view(MARINE_PLAN_POLICY_DOCUMENTS_REVIEW_VIEW_ROUTE, {
      pageTitle: PAGE_TITLE,
      heading: PAGE_TITLE,
      projectName,
      backLink:
        returnLink ??
        getValidatedReferrerPath(request.headers?.referer) ??
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
      continueLink:
        returnLink ?? marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
      documents: buildMarinePlanPolicyDocumentsData(marineLicence),
      newUploadLink:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
      outstandingPoliciesText: outstandingPoliciesText(
        marinePlanPolicySupportingDocuments.documentsOutstanding
      )
    })
  }
}
