import {
  getCoordinateSystem,
  getExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  getCoordinateSystemText,
  getReviewSummaryText,
  getCoordinateDisplayText,
  getSiteDetailsBackLink
} from './utils.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import Boom from '@hapi/boom'

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
      await authenticatedPatchRequest(request, '/exemption/site-details', {
        siteDetails: exemption.siteDetails,
        id: exemption.id
      })

      return h.redirect(routes.TASK_LIST)
    } catch (e) {
      throw Boom.badRequest(`Error submitting site review`, e)
    }
  }
}
