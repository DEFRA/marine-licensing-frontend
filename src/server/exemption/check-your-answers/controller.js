import Boom from '@hapi/boom'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { createSiteDetailsDataJson } from '~/src/server/common/helpers/site-details.js'
import { getCoordinateSystem } from '~/src/server/common/helpers/coordinate-utils.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import {
  processSiteDetails,
  errorMessages as siteDetailsErrorMessages
} from '~/src/server/common/helpers/exemption-site-details.js'

const errorMessages = {
  EXEMPTION_NOT_FOUND: 'Exemption not found',
  EXEMPTION_DATA_NOT_FOUND: 'Exemption data not found',
  SUBMISSION_FAILED: 'Error submitting exemption',
  UNEXPECTED_API_RESPONSE: 'Unexpected API response format',
  USER_SESSION_NOT_FOUND: 'User session not found',
  ...siteDetailsErrorMessages
}

const apiPaths = {
  getExemption: (id) => `/exemption/${id}`,
  submitExemption: '/exemption/submit'
}

const checkYourAnswersViewContent = {
  title: 'Check your answers',
  description: 'Please review your answers before submitting your application.',
  backLink: routes.TASK_LIST
}

/**
 * Validates exemption and fetches data from API
 * @param {object} request - Hapi request object
 * @param {object} exemption - Exemption data from cache
 * @returns {Promise<object>} API response payload
 */
const validateAndFetchExemption = async (request, exemption) => {
  const { id } = exemption
  if (!id) {
    request.logger.error({ id }, errorMessages.EXEMPTION_NOT_FOUND)
    throw Boom.notFound(errorMessages.EXEMPTION_NOT_FOUND, { id })
  }

  const { payload } = await authenticatedGetRequest(
    request,
    apiPaths.getExemption(id)
  )

  if (!payload?.value?.taskList) {
    request.logger.error({ id }, errorMessages.EXEMPTION_DATA_NOT_FOUND)
    throw Boom.notFound(
      `${errorMessages.EXEMPTION_DATA_NOT_FOUND} for id: ${id}`,
      { id }
    )
  }

  return payload
}

export const CHECK_YOUR_ANSWERS_VIEW_ROUTE =
  'exemption/check-your-answers/index'

/**
 * A GDS styled check your answers page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const checkYourAnswersController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { id } = exemption

    await validateAndFetchExemption(request, exemption)
    const siteDetails = processSiteDetails(exemption, id, request)
    const { coordinateSystem } = getCoordinateSystem(request)
    const siteDetailsData = createSiteDetailsDataJson(
      siteDetails,
      coordinateSystem
    )

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...exemption,
      siteDetails,
      siteDetailsData,
      isReadOnly: false
    })
  }
}

/**
 * A GDS styled check your answers submission controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const checkYourAnswersSubmitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const { id } = exemption

    await validateAndFetchExemption(request, exemption)

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
