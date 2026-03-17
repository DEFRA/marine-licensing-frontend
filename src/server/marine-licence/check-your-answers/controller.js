import { 
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'

const checkYourAnswersViewContent = {
  pageTitle: 'Check your answers before sending your information',
  backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const CHECK_YOUR_ANSWERS_VIEW_ROUTE =
  'marine-licence/check-your-answers/index'

export const checkYourAnswersController = {
  async handler(request, h) {
    let cachedMarineLicence = getMarineLicenceCache(request)

    if (!cachedMarineLicence.specialLegalPowers && cachedMarineLicence.id) {
      const service = getMarineLicenceService(request)
      const dbLicence = await service.getMarineLicenceById(cachedMarineLicence.id)
      cachedMarineLicence = {
        ...cachedMarineLicence,
        specialLegalPowers: dbLicence.specialLegalPowers
      }
      await setMarineLicenceCache(request, h, cachedMarineLicence)
    }

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...cachedMarineLicence
    })
  }
}

export const checkYourAnswersContinueController = {
  async handler(_request, h) {
    return h.redirect(routes.DECLARATION)
  }
}
