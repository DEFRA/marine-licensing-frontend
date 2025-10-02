import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Determines the back link for same activity description page
 * @param {object} exemption - The exemption data from cache
 * @param {object} siteDetails - Site details object
 * @returns {string} The route to redirect to
 */
export const getBackLink = (exemption, siteDetails) => {
  if (
    siteDetails.coordinatesType === 'file' &&
    exemption.multipleSiteDetails.sameActivityDates === 'no'
  ) {
    return routes.SAME_ACTIVITY_DATES
  }

  return routes.SITE_DETAILS_ACTIVITY_DATES
}
