import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Determines the next route after activity dates submission
 * @param {object} exemption - The exemption data from cache
 * @param {boolean} isInSiteDetailsFlow - Whether we're in the site details flow
 * @returns {string} The route to redirect to
 */
export const getNextRoute = (exemption, isInSiteDetailsFlow) => {
  if (!isInSiteDetailsFlow) {
    return routes.TASK_LIST
  }

  const multipleSitesEnabled =
    exemption?.multipleSiteDetails?.multipleSitesEnabled

  return multipleSitesEnabled
    ? routes.SAME_ACTIVITY_DESCRIPTION
    : routes.SITE_DETAILS_ACTIVITY_DESCRIPTION
}
