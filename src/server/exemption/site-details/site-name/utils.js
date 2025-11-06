import { setExemptionCache } from '#src/server/common/helpers/session-cache/utils.js'

export const shouldAddNewSite = (site, exemption) =>
  site && site > exemption.siteDetails.length

export const getSiteDataFromParam = (site) => ({
  siteIndex: site ? site - 1 : 0,
  siteNumber: site ?? 1
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
