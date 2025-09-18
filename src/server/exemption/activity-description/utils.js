import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Determines the next route after activity description submission
 * @param {object} exemption - The exemption data from cache
 * @param {boolean} isInSiteDetailsFlow - Whether we're in the site details flow
 * @param {number} siteIndex - Index of site
 * @param {string} queryParams - Query parameters to append to the route
 * @returns {string} The route to redirect to
 */
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
