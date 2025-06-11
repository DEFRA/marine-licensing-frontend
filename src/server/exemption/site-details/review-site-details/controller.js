import {
  getCoordinateSystem,
  getExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { config } from '~/src/config/config.js'
import {
  getCoordinateSystemText,
  getReviewSummaryText,
  getCoordinateDisplayText,
  getSiteDetailsBackLink
} from './utils.js'
import Boom from '@hapi/boom'
import Wreck from '@hapi/wreck'

export const REVIEW_SITE_DETAILS_VIEW_ROUTE =
  'exemption/site-details/review-site-details/index'

const reviewSiteDetailsPageData = {
  pageTitle: 'Review site details',
  heading: 'Review site details'
}

/**
 * A GDS styled page controller for the review site details page.
 * @satisfies {Partial<ServerRoute>}
 */
export const reviewSiteDetailsController = {
  handler(request, h) {
    const previousPage = request.headers?.referer

    const exemption = getExemptionCache(request)
    const { coordinateSystem } = getCoordinateSystem(request)

    const siteDetails = exemption.siteDetails ?? {}

    const { circleWidth } = siteDetails

    const summaryData = {
      method: getReviewSummaryText(siteDetails),
      coordinateSystem: getCoordinateSystemText(coordinateSystem),
      coordinates: getCoordinateDisplayText(siteDetails, coordinateSystem),
      width: circleWidth ? `${circleWidth} metres` : ''
    }

    return h.view(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
      ...reviewSiteDetailsPageData,
      backLink: getSiteDetailsBackLink(previousPage),
      projectName: exemption.projectName,
      summaryData
    })
  }
}

/**
 * A GDS styled page controller for the POST route in the review site details page.
 * @satisfies {Partial<ServerRoute>}
 */
export const reviewSiteDetailsSubmitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)

    try {
      await Wreck.patch(
        `${config.get('backend').apiUrl}/exemption/site-details`,
        {
          payload: {
            siteDetails: exemption.siteDetails,
            id: exemption.id
          },
          json: true
        }
      )

      return h.redirect(routes.TASK_LIST)
    } catch (e) {
      throw Boom.badRequest(`Error submitting site review`, e)
    }
  }
}
