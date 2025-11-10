import Boom from '@hapi/boom'
import {
  clearExemptionCache,
  getExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { processSiteDetails } from '#src/server/common/helpers/exemption-site-details.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { getExemptionService } from '#src/services/exemption-service/index.js'
import { buildSiteLocationData } from '#src/server/common/helpers/site-location-data.js'

const apiPaths = {
  submitExemption: '/exemption/submit'
}

const checkYourAnswersViewContent = {
  pageTitle: 'Check your answers before sending your information',
  backLink: routes.TASK_LIST
}

export const CHECK_YOUR_ANSWERS_VIEW_ROUTE =
  'exemption/check-your-answers/index'
export const checkYourAnswersController = {
  async handler(request, h) {
    const cachedExemption = getExemptionCache(request)
    const { id, multipleSiteDetails } = cachedExemption
    const siteDetails = processSiteDetails(cachedExemption, id, request)

    const exemptionService = getExemptionService(request)
    const savedExemption = await exemptionService.getExemptionById(id)

    const siteLocationData = buildSiteLocationData(
      cachedExemption.multipleSiteDetails,
      cachedExemption.siteDetails
    )

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...cachedExemption,
      mcmsContext: savedExemption.mcmsContext,
      siteDetails,
      siteLocationData,
      multipleSiteDetails,
      isReadOnly: false
    })
  }
}
export const checkYourAnswersSubmitController = {
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
          error: error.message,
          exemptionId: id
        },
        errorMessages.SUBMISSION_FAILED
      )
      throw Boom.badRequest(errorMessages.SUBMISSION_FAILED, error)
    }
  }
}
