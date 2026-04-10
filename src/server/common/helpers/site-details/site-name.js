export const getSiteDataFromParam = (site) => ({
  siteIndex: site ? Number.parseInt(site, 10) - 1 : 0,
  siteNumber: site ? Number.parseInt(site, 10) : 1
})

export const shouldAddNewSite = (site, exemption) =>
  site && site > exemption.siteDetails.length

export const hasInvalidSiteNumber = (siteNumber, siteDetails) => {
  const editingExistingSite = siteNumber <= siteDetails.length
  const addingNewSite = siteNumber === siteDetails.length + 1

  return !editingExistingSite && !addingNewSite
}
