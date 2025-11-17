import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'

export const copySameActivityDatesToAllSites = async (request, h) => {
  const exemption = getExemptionCache(request)
  const firstSiteDates = exemption.siteDetails[0]?.activityDates

  if (firstSiteDates) {
    for (const [index] of exemption.siteDetails.entries()) {
      if (index > 0) {
        await updateExemptionSiteDetails(
          request,
          h,
          index,
          'activityDates',
          firstSiteDates
        )
      }
    }
  }
}

export const copySameActivityDescriptionToAllSites = async (request, h) => {
  const exemption = getExemptionCache(request)
  const firstSiteDescription = exemption.siteDetails[0]?.activityDescription

  if (firstSiteDescription) {
    for (const [index] of exemption.siteDetails.entries()) {
      if (index > 0) {
        await updateExemptionSiteDetails(
          request,
          h,
          index,
          'activityDescription',
          firstSiteDescription
        )
      }
    }
  }
}

export const clearActivityData = async (request, key, h) => {
  const exemption = getExemptionCache(request)
  for (const [index] of exemption.siteDetails.entries()) {
    await updateExemptionSiteDetails(request, h, index, key, null)
  }
}
