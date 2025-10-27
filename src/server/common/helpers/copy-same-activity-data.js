import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'

export const copySameActivityDatesToAllSites = (request) => {
  const exemption = getExemptionCache(request)
  const firstSiteDates = exemption.siteDetails[0]?.activityDates

  if (firstSiteDates) {
    for (const [index] of exemption.siteDetails.entries()) {
      if (index > 0) {
        updateExemptionSiteDetails(
          request,
          index,
          'activityDates',
          firstSiteDates
        )
      }
    }
  }
}

export const copySameActivityDescriptionToAllSites = (request) => {
  const exemption = getExemptionCache(request)
  const firstSiteDescription = exemption.siteDetails[0]?.activityDescription

  if (firstSiteDescription) {
    for (const [index] of exemption.siteDetails.entries()) {
      if (index > 0) {
        updateExemptionSiteDetails(
          request,
          index,
          'activityDescription',
          firstSiteDescription
        )
      }
    }
  }
}
