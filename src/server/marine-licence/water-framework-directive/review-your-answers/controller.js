import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
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

    return h.view(REVIEW_YOUR_ANSWERS_VIEW_ROUTE, {
      ...reviewYourAnswersPageData,
      projectName: marineLicence.projectName,
      backLink: getBackLink(request, waterFrameworkDirective)
    })
  }
}

export const reviewYourAnswersSubmitController = {
  async handler(request, h) {
    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  }
}
