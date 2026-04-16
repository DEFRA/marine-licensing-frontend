import { parseActivityDetails } from '#src/server/common/helpers/review-site-details/activity-details.js'
import { parseGeoJSONCoordinates } from '#src/server/common/helpers/review-site-details/geo.js'

export const getFileUploadSummaryData = (project) => {
  const siteDetails = project.siteDetails || {}
  const geoJSON = siteDetails.geoJSON || {}
  const activityDetails = siteDetails.activityDetails || []

  const coordinates = parseGeoJSONCoordinates(geoJSON)
  const formattedActivityDetails = parseActivityDetails(activityDetails)

  return {
    coordinates,
    geoJSON,
    activityDetails: formattedActivityDetails
  }
}
