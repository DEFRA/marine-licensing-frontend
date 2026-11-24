import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getCheckAnswersRedirect } from '#src/server/marine-licence/public-register/utils.js'
import {
  getCommonRedirectLink,
  withCheckYourAnswersQuery
} from '#src/server/common/helpers/marine-licence/redirect-link.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import { publicRegisterCheckAnswersSettings } from '#src/server/marine-licence/public-register/check-answers/constants.js'
import {
  getBackLink,
  getCheckAnswersSummary
} from '#src/server/marine-licence/public-register/check-answers/utils.js'

export const PUBLIC_REGISTER_CHECK_ANSWERS_VIEW_ROUTE =
  'marine-licence/public-register/check-answers/index'

export const publicRegisterCheckAnswersController = {
  handler(request, h) {
    const { projectName, publicRegister } = getMarineLicenceCache(request)

    const redirectPage = getCheckAnswersRedirect(publicRegister)
    if (redirectPage) {
      return h.redirect(withCheckYourAnswersQuery(request, redirectPage))
    }

    return h.view(PUBLIC_REGISTER_CHECK_ANSWERS_VIEW_ROUTE, {
      ...publicRegisterCheckAnswersSettings,
      projectName,
      summary: getCheckAnswersSummary(request, publicRegister),
      backLink: getBackLink(request, publicRegister)
    })
  }
}

export const publicRegisterCheckAnswersSubmitController = {
  async handler(request, h) {
    const { id, publicRegister } = getMarineLicenceCache(request)

    const redirectPage = getCheckAnswersRedirect(publicRegister)
    if (redirectPage) {
      return h.redirect(withCheckYourAnswersQuery(request, redirectPage))
    }

    await authenticatedPatchRequest(
      request,
      apiRoutes.CONFIRM_PUBLIC_REGISTER,
      {
        id
      }
    )

    return h.redirect(getCommonRedirectLink(request))
  }
}
