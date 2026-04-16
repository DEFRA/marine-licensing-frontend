export const getSiteDataFromParam = (query = {}) => ({
  siteIndex: query.site ? Number.parseInt(query.site, 10) - 1 : 0,
  siteNumber: query.site ? Number.parseInt(query.site, 10) : 1,
  ...(query.activity && {
    activityDetailsIndex: Number.parseInt(query.activity, 10) - 1,
    activityDetailsNumber: Number.parseInt(query.activity, 10)
  })
})

export const shouldAddNewSite = (site, exemption) =>
  site && site > exemption.siteDetails.length

export const hasInvalidSiteNumber = (siteNumber, siteDetails) => {
  const editingExistingSite = siteNumber <= siteDetails.length
  const addingNewSite = siteNumber === siteDetails.length + 1

  return !editingExistingSite && !addingNewSite
}
