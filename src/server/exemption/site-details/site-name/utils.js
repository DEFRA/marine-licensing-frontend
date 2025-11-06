import { setExemptionCache } from '#src/server/common/helpers/session-cache/utils.js'

export const shouldAddNewSite = (site, exemption) =>
  site && site > exemption.siteDetails.length

export const getSiteDataFromParam = (site) => ({
  siteIndex: site ? Number.parseInt(site, 10) - 1 : 0,
  siteNumber: site ? Number.parseInt(site, 10) : 1
})

export const addNewSite = async (request, h, exemption, payload) => {
  const { siteDetails } = exemption

  const updatedSiteDetails = [
    ...siteDetails,
    {
      coordinatesType: siteDetails[0].coordinatesType,
      siteName: payload.siteName
    }
  ]

  await setExemptionCache(request, h, {
    ...exemption,
    siteDetails: updatedSiteDetails
  })
}

export const hasInvalidSiteNumber = (siteNumber, siteDetails) => {
  const editingExistingSite = siteNumber <= siteDetails.length
  const addingNewSite = siteNumber === siteDetails.length + 1

  return !editingExistingSite && !addingNewSite
}
