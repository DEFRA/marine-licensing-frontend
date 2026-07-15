import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { buildSummaryData } from '#src/server/common/helpers/marine-licence/summary-data.js'
import { setReturnToCache } from '#src/server/common/helpers/marine-licence/session-cache/return-to-cache.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { waterFrameworkReviewData } from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import { getWaterFrameworkDirectiveChangeLink } from '#src/server/marine-licence/check-your-answers/utils.js'
import { buildMarinePlanPoliciesData } from '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'

const checkYourAnswersViewContent = {
  pageTitle: 'Check your answers before sending your information',
  backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const CHECK_YOUR_ANSWERS_VIEW_ROUTE =
  'marine-licence/check-your-answers/index'

export const checkYourAnswersController = {
  async handler(request, h) {
    const cachedMarineLicence = getMarineLicenceCache(request)
    await setReturnToCache(
      request,
      h,
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )

    let siteData = { coordinatesType: null, summaryData: [] }
    let waterFrameworkDirective = cachedMarineLicence.waterFrameworkDirective
    let marinePlanPolicies = []

    if (cachedMarineLicence.id) {
      const marineLicenceService = getMarineLicenceService(request)
      const completeMarineLicence =
        await marineLicenceService.getMarineLicenceById(cachedMarineLicence.id)
      siteData = buildSiteData(completeMarineLicence)
      marinePlanPolicies = buildMarinePlanPoliciesData(completeMarineLicence)

      // A user may have cancelled out of the WFD flow part way and returned to this page
      // So it is necessary to reset the cache of this property to the server value
      waterFrameworkDirective = completeMarineLicence.waterFrameworkDirective
      await setMarineLicenceCache(request, h, {
        ...cachedMarineLicence,
        waterFrameworkDirective
      })
    }

    const formattedMarineLicence = buildSummaryData(cachedMarineLicence)

    const waterFrameworkDirectiveData = waterFrameworkReviewData(
      waterFrameworkDirective
    )

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...cachedMarineLicence,
      coordinatesType: siteData.coordinatesType,
      summaryData: siteData.summaryData,
      reviewSiteDetailsRoute:
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      ...formattedMarineLicence,
      publicRegisterRoute: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      waterFrameworkDirectiveData,
      waterFrameworkDirectiveChangeLink: getWaterFrameworkDirectiveChangeLink(
        waterFrameworkDirective
      ),
      marinePlanPolicies
    })
  }
}

export const checkYourAnswersContinueController = {
  async handler(_request, h) {
    return h.redirect(routes.DECLARATION)
  }
}
