import { routes } from '#src/server/common/constants/routes.js'
export const getBackRoute = (request, exemption, action) => {
  const { siteIndex, siteNumber, queryParams } = request.site
  const { multipleSiteDetails } = exemption

  if (action) {
    return `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
  }

  if (siteIndex === 0) {
    return routes.SITE_DETAILS_ACTIVITY_DESCRIPTION
  }

  return multipleSiteDetails.sameActivityDescription === 'yes'
    ? routes.SITE_NAME + queryParams
    : routes.SITE_DETAILS_ACTIVITY_DESCRIPTION + queryParams
}
