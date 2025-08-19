import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Determines the correct back link for the coordinates entry page based on the multipleSitesEnabled setting
 * @param {object} exemption - The exemption data from cache
 * @returns {string} The back link URL
 */
export const getCoordinatesEntryBackLink = (exemption) => {
  return exemption?.multipleSiteDetails?.multipleSitesEnabled
    ? routes.SITE_NAME
    : routes.MULTIPLE_SITES_CHOICE
}
