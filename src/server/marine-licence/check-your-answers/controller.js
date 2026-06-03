import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { buildSummaryData } from '#src/server/common/helpers/marine-licence/summary-data.js'

const checkYourAnswersViewContent = {
  pageTitle: 'Check your answers before sending your information',
  backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const CHECK_YOUR_ANSWERS_VIEW_ROUTE =
  'marine-licence/check-your-answers/index'

export const checkYourAnswersController = {
  async handler(request, h) {
    const cachedMarineLicence = getMarineLicenceCache(request)

    const formattedMarineLicence = buildSummaryData(cachedMarineLicence)

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
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
