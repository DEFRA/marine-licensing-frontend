import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { buildManualCoordinateSummaryData } from '#src/server/common/helpers/review-site-details/manual-entry.js'
import { getFileUploadSummaryData } from '#src/server/common/helpers/review-site-details/file-upload.js'
import { createSiteDetailsDataJson } from '#src/server/common/helpers/site-details.js'
import { parseActivityDetails } from '#src/server/common/helpers/review-site-details/activity-details.js'

const buildFileUploadSummaryData = (marineLicence, siteDetails) =>
  siteDetails.map((site, index) => ({
    ...getFileUploadSummaryData({ ...marineLicence, siteDetails: site }),
    siteName: site.siteName,
    siteNumber: index + 1,
    siteDetailsData: createSiteDetailsDataJson(site),
    activityDetails: parseActivityDetails(site)
  }))

export const buildCYASiteData = async (marineLicence, request) => {
  if (!marineLicence.id) {
    return { coordinatesType: null, summaryData: [] }
  }

  const marineLicenceService = getMarineLicenceService(request)
  const completeMarineLicence = await marineLicenceService.getMarineLicenceById(
    marineLicence.id
  )

  const { siteDetails, multipleSiteDetails } = completeMarineLicence

  if (!siteDetails || siteDetails.length === 0) {
    return { coordinatesType: null, summaryData: [] }
  }

  const { coordinatesType } = getSiteDetailsBySite(completeMarineLicence)

  if (coordinatesType === 'file') {
    return {
      coordinatesType,
      summaryData: buildFileUploadSummaryData(
        completeMarineLicence,
        siteDetails
      )
    }
  }

  if (coordinatesType === 'coordinates') {
    return {
      coordinatesType,
      summaryData: buildManualCoordinateSummaryData(
        siteDetails,
        multipleSiteDetails ?? {}
      )
    }
  }

  return { coordinatesType: null, summaryData: [] }
}
