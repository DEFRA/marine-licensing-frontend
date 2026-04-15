import { parseGeoJSONCoordinates } from '#src/server/common/helpers/review-site-details/geo.js'

export const getFileUploadSummaryData = (project) => {
  const siteDetails = project.siteDetails || {}
  const geoJSON = siteDetails.geoJSON || {}
  const activityDetails = siteDetails.activityDetails || []

  const coordinates = parseGeoJSONCoordinates(geoJSON)
  return {
    coordinates,
    geoJSON,
    activityDetails
  }
}
