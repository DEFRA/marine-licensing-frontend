import { routes } from '#src/server/common/constants/routes.js'
export const getNextRoute = (
  exemption,
  isInSiteDetailsFlow,
  queryParams = ''
) => {
  if (!isInSiteDetailsFlow) {
    return routes.TASK_LIST
  }

  const multipleSitesEnabled =
    exemption?.multipleSiteDetails?.multipleSitesEnabled

  const nextRoute = multipleSitesEnabled
    ? routes.SAME_ACTIVITY_DESCRIPTION
    : routes.SITE_DETAILS_ACTIVITY_DESCRIPTION

  return nextRoute + queryParams
}
export const getBackRoute = (siteIndex, queryParams = '') => {
  if (siteIndex === 0) {
    return routes.SAME_ACTIVITY_DATES
  }

  return routes.SITE_NAME + queryParams
}
