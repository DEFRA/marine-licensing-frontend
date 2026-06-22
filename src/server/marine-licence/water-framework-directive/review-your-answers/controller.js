import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { waterFrameworkReviewData } from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import { getBackLink } from '#src/server/marine-licence/water-framework-directive/review-your-answers/utils.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'
import { clearWaterFrameworkDirectiveReturnToCache } from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'

export const REVIEW_YOUR_ANSWERS_VIEW_ROUTE =
  'marine-licence/water-framework-directive/review-your-answers/index'

const REVIEW_YOUR_ANSWERS_PAGE_TITLE =
  'Check your answers for Water Framework Directive'

const reviewYourAnswersPageData = {
  pageTitle: REVIEW_YOUR_ANSWERS_PAGE_TITLE,
  heading: REVIEW_YOUR_ANSWERS_PAGE_TITLE
}

export const waterFrameworkReviewYourAnswersController = {
  async handler(request, h) {
    clearWaterFrameworkDirectiveReturnToCache(request)

    const cachedMarineLicence = getMarineLicenceCache(request)

    const marineLicenceService = getMarineLicenceService(request)
    const marineLicence = await marineLicenceService.getMarineLicenceById(
      cachedMarineLicence.id
    )

    const { waterFrameworkDirective = {} } = marineLicence

    await setMarineLicenceCache(request, h, {
      ...cachedMarineLicence,
      waterFrameworkDirective
    })

    if (waterFrameworkDirective.nauticalMile === 'no') {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
      )
    }

    const wfdDisplayData = waterFrameworkReviewData(waterFrameworkDirective)

    return h.view(REVIEW_YOUR_ANSWERS_VIEW_ROUTE, {
      ...reviewYourAnswersPageData,
      projectName: marineLicence.projectName,
      backLink: getBackLink(request, waterFrameworkDirective),
      waterFrameworkDirective,
      wfdDisplayData,
      routes: marineLicenceRoutes
    })
  }
}

export const reviewYourAnswersSubmitController = {
  async handler(request, h) {
    const redirectPath = request.yar.get(RETURN_TO_CACHE_KEY)
    if (redirectPath) {
      return h.redirect(`${redirectPath}#water-framework-directive-card`)
    }
    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  }
}
