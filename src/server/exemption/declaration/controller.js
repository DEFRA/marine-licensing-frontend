import Boom from '@hapi/boom'
import {
  clearExemptionCache,
  getExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'

const apiPaths = {
  submitExemption: '/exemption/submit'
}

export const DECLARATION_VIEW_ROUTE = 'exemption/declaration/index'

export const declarationController = {
  handler(request, h) {
    const { projectName } = getExemptionCache(request)
    return h.view(DECLARATION_VIEW_ROUTE, {
      pageTitle: 'Declaration',
      backLink: routes.CHECK_YOUR_ANSWERS,
      projectName
    })
  }
}

export const declarationSubmitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { id } = exemption
    try {
      const { displayName, email } = await getUserSession(
        request,
        request.state?.userSession
      )
      if (!displayName || !email) {
        throw new Error(errorMessages.USER_SESSION_NOT_FOUND)
      }
      const { payload: response } = await authenticatedPostRequest(
        request,
        apiPaths.submitExemption,
        {
          id,
          userName: displayName,
          userEmail: email
        }
      )

      if (response?.message === 'success' && response?.value) {
        await clearExemptionCache(request, h)
        const { applicationReference } = response.value
        return h.redirect(
          `/exemption/confirmation?applicationReference=${applicationReference}`
        )
      }

      throw new Error(errorMessages.UNEXPECTED_API_RESPONSE)
    } catch (error) {
      request.logger.error(
        {
          err: error,
          exemptionId: id
        },
        errorMessages.SUBMISSION_FAILED
      )
      throw Boom.badRequest(errorMessages.SUBMISSION_FAILED, error)
    }
  }
}
