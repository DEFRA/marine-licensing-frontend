import { getMarineLicenseCache } from '#src/server/common/helpers/marine-license/session-cache/utils.js'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'

const checkYourAnswersViewContent = {
  pageTitle: 'Check your answers before sending your information',
  backLink: marineLicenseRoutes.MARINE_LICENSE_TASK_LIST
}

export const CHECK_YOUR_ANSWERS_VIEW_ROUTE =
  'marine-license/check-your-answers/index'

export const checkYourAnswersController = {
  async handler(request, h) {
    const cachedMarineLicense = getMarineLicenseCache(request)
    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...cachedMarineLicense
    })
  }
}
