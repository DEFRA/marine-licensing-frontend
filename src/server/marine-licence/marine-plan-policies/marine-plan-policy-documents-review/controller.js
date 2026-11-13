import Boom from '@hapi/boom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getValidatedReferrerPath } from '#src/server/common/helpers/referrer-validation.js'

export const MARINE_PLAN_POLICY_DOCUMENTS_REVIEW_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-documents-review/index'

const PAGE_TITLE = 'Supporting documents'

export const marinePlanPolicyDocumentsReviewController = {
  async handler(request, h) {
    const cached = getMarineLicenceCache(request)

    if (!cached?.id) {
      throw Boom.notFound('Marine licence not found')
    }

    const marineLicenceService = getMarineLicenceService(request)

    const { projectName } = await marineLicenceService.getMarineLicenceById(
      cached.id
    )

    return h.view(MARINE_PLAN_POLICY_DOCUMENTS_REVIEW_VIEW_ROUTE, {
      pageTitle: PAGE_TITLE,
      heading: PAGE_TITLE,
      projectName,
      backLink:
        getValidatedReferrerPath(request.headers?.referer) ??
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
      continueLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    })
  }
}
