import { routes } from '#src/server/common/constants/routes.js'
export const getBackLink = (
  exemption,
  isInSiteDetailsFlow,
  siteIndex = 0,
  queryParams = ''
) => {
  if (!isInSiteDetailsFlow) {
    return routes.TASK_LIST
  }

  const multipleSitesEnabled =
    exemption?.multipleSiteDetails?.multipleSitesEnabled

  if (!multipleSitesEnabled) {
    return routes.SITE_DETAILS_ACTIVITY_DATES
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
export const getNextRoute = (isInSiteDetailsFlow, site) => {
  if (!isInSiteDetailsFlow) {
    return routes.TASK_LIST
  }

  const { siteDetails, queryParams } = site

  if (siteDetails.coordinatesType === 'file') {
    return routes.REVIEW_SITE_DETAILS
  }

  return routes.COORDINATES_ENTRY_CHOICE + queryParams
}
