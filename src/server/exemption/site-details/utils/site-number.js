export const getSiteNumber = (exemption, request) => {
  const { siteDetails } = exemption || {}
  const urlSiteIndex = request?.query?.site

  if (Array.isArray(siteDetails) && urlSiteIndex) {
    const siteNumber = parseInt(urlSiteIndex, 10)

    if (!isNaN(siteNumber) && siteDetails?.[siteNumber - 1]) {
      return siteNumber
    }
  }

  return 1
}
