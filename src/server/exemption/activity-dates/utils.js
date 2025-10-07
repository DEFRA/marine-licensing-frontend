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
 * @param {object} exemption - The exemption data from cache
 * @returns {string} The route to redirect to
 */
export const getBackRoute = (siteIndex, queryParams = '', exemption = null) => {
  if (siteIndex === 0) {
    const isMultipleSites = exemption?.multipleSiteDetails?.multipleSitesEnabled

    if (
      !isMultipleSites &&
      exemption?.siteDetails?.[0]?.coordinatesType === 'file'
    ) {
      return routes.FILE_UPLOAD
    }

    if (!isMultipleSites) {
      return routes.MULTIPLE_SITES_CHOICE
    }

    return routes.SAME_ACTIVITY_DATES
  }

  return routes.SITE_NAME + queryParams
}
