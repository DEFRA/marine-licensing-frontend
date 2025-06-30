import Boom from '@hapi/boom'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import {
  getCoordinateSystemText,
  getCoordinateDisplayText,
  getReviewSummaryText
} from '~/src/server/exemption/site-details/review-site-details/utils.js'

const checkYourAnswersViewContent = {
  title: 'Check your answers',
  description: 'Please review your answers before submitting your application.',
  backLink: '/exemption/task-list'
}

const CHECK_YOUR_ANSWERS_VIEW_ROUTE = 'exemption/check-your-answers/index'

export const checkYourAnswersController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)

    const { id } = exemption
    if (!id) {
      throw Boom.notFound(`Exemption not found`, { id })
    }

    const { payload } = await authenticatedGetRequest(
      request,
      `/exemption/${id}`
    )

    if (!payload?.value?.taskList) {
      throw Boom.notFound(`Exemption data not found for id: ${id}`, { id })
    }

    const siteDetails = exemption.siteDetails
      ? {
          ...exemption.siteDetails,
          coordinateSystemText: getCoordinateSystemText(
            exemption.siteDetails.coordinateSystem
          ),
          coordinateDisplayText: getCoordinateDisplayText(
            exemption.siteDetails,
            exemption.siteDetails.coordinateSystem
          ),
          reviewSummaryText: getReviewSummaryText(exemption.siteDetails)
        }
      : null

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...exemption,
      siteDetails
    })
  }
}

export const checkYourAnswersSubmitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)

    const { id } = exemption
    if (!id) {
      throw Boom.notFound(`Exemption not found`, { id })
    }

    try {
      const { payload: response } = await authenticatedPostRequest(
        request,
        '/exemption/submit',
        { id }
      )

      if (response?.message === 'success' && response?.value) {
        const { applicationReference } = response.value
        return h.redirect(
          `/exemption/confirmation?applicationReference=${applicationReference}`
        )
      }

      throw new Error('Unexpected API response format')
    } catch (error) {
      throw Boom.badRequest('Error submitting exemption', error)
    }
  }
}
