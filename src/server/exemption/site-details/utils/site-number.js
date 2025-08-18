/**
 * Determines the site number for the current site
 * @param {Object} exemption - The exemption data from cache
 * @param {Object} request - The Hapi request object
 * @returns {number} The site number
 */
export const getSiteNumber = (exemption, request) => {
  const { siteDetails } = exemption || {}
  const urlSiteIndex = request?.params?.siteIndex

  if (Array.isArray(siteDetails)) {
    if (urlSiteIndex) {
      const siteNumber = parseInt(urlSiteIndex)

      if (!isNaN(siteNumber) && siteDetails?.[siteNumber - 1]) {
        return siteNumber
      }
    }

    return 1
  }

  return 1
}
