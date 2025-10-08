export const getSiteDetailsBySite = (exemption, siteIndex = 0) => {
  const { multipleSiteDetails } = exemption

  if (!multipleSiteDetails?.multipleSitesEnabled) {
    return exemption.siteDetails?.[0] ?? {}
  }

  return exemption.siteDetails?.[siteIndex] ?? {}
}
