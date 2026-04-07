import { setExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'

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
