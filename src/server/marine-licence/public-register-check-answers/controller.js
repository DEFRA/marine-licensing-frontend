import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  getIncompleteWithholdingPage,
  getReasonPage
} from '#src/server/common/helpers/marine-licence/public-register.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { publicRegisterCheckAnswersSettings } from '#src/server/marine-licence/public-register-check-answers/constants.js'
import { getCheckAnswersSummary } from '#src/server/marine-licence/public-register-check-answers/utils.js'

const PUBLIC_REGISTER_CHECK_ANSWERS_VIEW_ROUTE =
  'marine-licence/public-register-check-answers/index'

export const publicRegisterCheckAnswersController = {
  handler(request, h) {
    const { projectName, publicRegister } = getMarineLicenceCache(request)

    const incompletePage = getIncompleteWithholdingPage(publicRegister)
    if (incompletePage) {
      return h.redirect(incompletePage)
    }

    return h.view(PUBLIC_REGISTER_CHECK_ANSWERS_VIEW_ROUTE, {
      ...publicRegisterCheckAnswersSettings,
      projectName,
      summary: getCheckAnswersSummary(publicRegister),
      backLink: getReasonPage(publicRegister)
    })
  }
}

export const publicRegisterCheckAnswersSubmitController = {
  async handler(request, h) {
    const { id, publicRegister } = getMarineLicenceCache(request)

    const incompletePage = getIncompleteWithholdingPage(publicRegister)
    if (incompletePage) {
      return h.redirect(incompletePage)
    }

    await authenticatedPatchRequest(
      request,
      apiRoutes.CONFIRM_PUBLIC_REGISTER,
      {
        id
      }
    )

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  }
}
