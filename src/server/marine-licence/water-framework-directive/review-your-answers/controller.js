import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { waterFrameworkReviewData } from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import { getBackLink } from './utils.js'

export const REVIEW_YOUR_ANSWERS_VIEW_ROUTE =
  'marine-licence/water-framework-directive/review-your-answers/index'

const reviewYourAnswersPageData = {
  pageTitle: 'Check your answers for Water Framework Directive',
  heading: 'Check your answers for Water Framework Directive'
}

export const waterFrameworkReviewYourAnswersController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { waterFrameworkDirective = {} } = marineLicence

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
      wfdDisplayData
    })
  }
}

export const reviewYourAnswersSubmitController = {
  async handler(_request, h) {
    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  }
}
