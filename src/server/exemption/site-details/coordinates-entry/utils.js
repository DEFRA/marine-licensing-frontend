import { routes } from '#src/server/common/constants/routes.js'
export const getBackRoute = (request, exemption) => {
  const { siteIndex, queryParams } = request.site
  const { multipleSiteDetails } = exemption

  if (siteIndex === 0) {
    return routes.ACTIVITY_DESCRIPTION
  }

  return multipleSiteDetails.sameActivityDescription === 'yes'
    ? routes.SITE_NAME + queryParams
    : routes.ACTIVITY_DESCRIPTION + queryParams
}
