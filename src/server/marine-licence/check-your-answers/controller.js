import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { buildSummaryData } from '#src/server/common/helpers/marine-licence/summary-data.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'

const checkYourAnswersViewContent = {
  pageTitle: 'Check your answers before sending your information',
  backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const CHECK_YOUR_ANSWERS_VIEW_ROUTE =
  'marine-licence/check-your-answers/index'

export const checkYourAnswersController = {
  async handler(request, h) {
    const cachedMarineLicence = getMarineLicenceCache(request)
    request.yar.flash(
      RETURN_TO_CACHE_KEY,
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
      true
    )

    let siteData = { coordinatesType: null, summaryData: [] }
    if (cachedMarineLicence.id) {
      const marineLicenceService = getMarineLicenceService(request)
      const completeMarineLicence =
        await marineLicenceService.getMarineLicenceById(cachedMarineLicence.id)
      siteData = buildSiteData(completeMarineLicence)
    }

    const formattedMarineLicence = buildSummaryData(cachedMarineLicence)

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...cachedMarineLicence,
      coordinatesType: siteData.coordinatesType,
      summaryData: siteData.summaryData,
      reviewSiteDetailsRoute:
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      ...formattedMarineLicence,
      publicRegisterRoute: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
    })
  }
}

export const checkYourAnswersContinueController = {
  async handler(_request, h) {
    return h.redirect(routes.DECLARATION)
  }
}
