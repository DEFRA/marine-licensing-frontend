/**
 * Gets site details from exemption data with safe array access
 * @param { object } exemption - Exemption object
 * @param { number } siteIndex - Index of site to retrieve (defaults to 0 for single site flows)
 * @returns { object } Site details object or empty object if not found
 */
export const getSiteDetailsBySite = (exemption, siteIndex = 0) => {
  const { multipleSiteDetails } = exemption

  if (!multipleSiteDetails?.multipleSitesEnabled) {
    return exemption.siteDetails?.[0] ?? {}
  }

  return exemption.siteDetails?.[siteIndex] ?? {}
}
