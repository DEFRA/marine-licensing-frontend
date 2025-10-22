import { routes } from '#src/server/common/constants/routes.js'
export const getBackLink = (exemption, siteIndex = 0, queryParams = '') => {
  const multipleSitesEnabled =
    exemption?.multipleSiteDetails?.multipleSitesEnabled

  if (!multipleSitesEnabled) {
    return routes.ACTIVITY_DATES
  }

  if (siteIndex === 0) {
    return routes.SAME_ACTIVITY_DESCRIPTION
  }

  const backLink =
    exemption?.multipleSiteDetails?.sameActivityDescription === 'yes'
      ? routes.SAME_ACTIVITY_DATES
      : routes.SAME_ACTIVITY_DESCRIPTION

  return backLink + queryParams
}
export const getNextRoute = (site) => {
  const { siteDetails, queryParams } = site

  if (siteDetails.coordinatesType === 'file') {
    return routes.REVIEW_SITE_DETAILS
  }

  return routes.COORDINATES_ENTRY_CHOICE + queryParams
}
