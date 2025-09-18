import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Determines back route for coordinates-entry
 * @param {object} request - The request object
 * @returns {string} The route to redirect to
 */
export const getBackRoute = (request, exemption) => {
  const { siteIndex, queryParams } = request.site
  const { multipleSiteDetails } = exemption

  if (siteIndex === 0) {
    return routes.SITE_DETAILS_ACTIVITY_DESCRIPTION
  }

  return multipleSiteDetails.sameActivityDescription === 'yes'
    ? routes.SITE_NAME + queryParams
    : routes.SITE_DETAILS_ACTIVITY_DESCRIPTION + queryParams
}
