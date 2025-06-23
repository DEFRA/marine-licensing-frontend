import Boom from '@hapi/boom'
import Wreck from '@hapi/wreck'
import { config } from '~/src/config/config.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import { getCoordinateSystemText } from '~/src/server/exemption/site-details/review-site-details/utils.js'

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

    const { payload } = await Wreck.get(
      `${config.get('backend').apiUrl}/exemption/${id}`,
      {
        json: true
      }
    )

    if (!payload?.value?.taskList) {
      throw Boom.notFound(`Exemption data not found for id: ${id}`, { id })
    }

    // Process site details to include formatted coordinate system text
    const processedSiteDetails = exemption.siteDetails
      ? {
          ...exemption.siteDetails,
          coordinateSystemText: getCoordinateSystemText(
            exemption.siteDetails.coordinateSystem
          )
        }
      : null

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...exemption,
      siteDetails: processedSiteDetails
    })
  }
}
