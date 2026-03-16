import { getExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { processSiteDetails } from '#src/server/common/helpers/exemptions/exemption-site-details.js'
import { getExemptionService } from '#src/services/exemption-service/index.js'
import { buildSiteLocationData } from '#src/server/common/helpers/site-location-data.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

const checkYourAnswersViewContent = {
  pageTitle: 'Check your answers before sending your information',
  backLink: routes.TASK_LIST
}

export const CHECK_YOUR_ANSWERS_VIEW_ROUTE =
  'exemption/check-your-answers/index'
export const checkYourAnswersController = {
  async handler(request, h) {
    const cachedExemption = getExemptionCache(request)
    const { id, multipleSiteDetails } = cachedExemption
    const siteDetails = processSiteDetails(cachedExemption, id, request)

    const exemptionService = getExemptionService(request)
    const savedExemption = await exemptionService.getExemptionById(id)

    const siteLocationData = buildSiteLocationData(
      cachedExemption.multipleSiteDetails,
      cachedExemption.siteDetails
    )
    request.yar.flash(RETURN_TO_CACHE_KEY, routes.CHECK_YOUR_ANSWERS, true)

    const siteLocationChangeLink = `${routes.REVIEW_SITE_DETAILS}?from=check-your-answers#site-location-card`
    const activityDetailsChangeLink = `${routes.REVIEW_SITE_DETAILS}?from=check-your-answers#activity-details-card`

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...cachedExemption,
      mcmsContext: savedExemption.mcmsContext,
      siteDetails,
      siteLocationData: {
        ...siteLocationData,
        changeLink: siteLocationChangeLink
      },
      activityDetailsChangeLink,
      reviewSiteDetailsRoute: routes.REVIEW_SITE_DETAILS,
      multipleSiteDetails,
      isReadOnly: false
    })
  }
}
export const checkYourAnswersSubmitController = {
  handler(_request, h) {
    return h.redirect(routes.DECLARATION)
  }
}
