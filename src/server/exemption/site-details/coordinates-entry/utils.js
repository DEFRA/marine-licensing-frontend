import { routes } from '#src/server/common/constants/routes.js'
export const getBackRoute = (site, exemption, action) => {
  const { siteIndex, siteNumber, queryParams } = site
  const { multipleSiteDetails } = exemption

  if (action) {
    return `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
  }

  if (siteIndex === 0) {
    return routes.ACTIVITY_DESCRIPTION
  }

  return multipleSiteDetails.sameActivityDescription === 'yes'
    ? routes.SITE_NAME + queryParams
    : routes.ACTIVITY_DESCRIPTION + queryParams
}
