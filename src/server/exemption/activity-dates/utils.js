import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Determines the next route after activity dates submission
 * @param {object} exemption - The exemption data from cache
 * @param {boolean} isInSiteDetailsFlow - Whether we're in the site details flow
 * @param {string} queryParams - Query parameters to append to the route
 * @returns {string} The route to redirect to
 */
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

/**
 * Determines the back link
 * @param {number} siteIndex - The siteIndex of site
 * @param {string} queryParams - Query parameters to append to the route
 * @returns {string} The route to redirect to
 */
export const getBackRoute = (siteIndex, queryParams = '') => {
  if (siteIndex === 0) {
    return routes.SAME_ACTIVITY_DATES
  }

  return routes.SITE_NAME + queryParams
}
