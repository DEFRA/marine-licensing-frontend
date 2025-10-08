import {
  getCoordinateSystemText,
  getCoordinateDisplayText,
  getReviewSummaryText,
  getFileUploadSummaryData,
  getPolygonCoordinatesDisplayData
} from '#src/server/exemption/site-details/review-site-details/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
export const errorMessages = {
  FILE_UPLOAD_DATA_ERROR: 'Error getting file upload summary data'
}
export const processFileUploadSiteDetails = (exemption, id, request) => {
  try {
    const siteDetails = getSiteDetailsBySite(exemption)
    const fileUploadData = getFileUploadSummaryData(exemption)

    return {
      ...siteDetails,
      isFileUpload: true,
      method: fileUploadData.method,
      fileType: fileUploadData.fileUploadType,
      filename: fileUploadData.uploadedFile.filename
    }
  } catch (error) {
    request.logger.error(
      {
        error: error.message,
        exemptionId: id
      },
      errorMessages.FILE_UPLOAD_DATA_ERROR
    )
    // Fallback to basic site details if file upload data unavailable
    const siteDetails = getSiteDetailsBySite(exemption)

    return {
      ...siteDetails,
      isFileUpload: true,
      method: 'Upload a file with the coordinates of the site',
      fileType: siteDetails.fileUploadType === 'kml' ? 'KML' : 'Shapefile',
      filename: siteDetails.uploadedFile?.filename || 'Unknown file'
    }
  }
}
export const processManualSiteDetails = (exemption) => {
  const siteDetails = getSiteDetailsBySite(exemption)
  const { coordinateSystem, coordinatesEntry } = siteDetails

  const baseData = {
    isFileUpload: false,
    coordinateSystemText: getCoordinateSystemText(coordinateSystem),
    reviewSummaryText: getReviewSummaryText(siteDetails),
    coordinatesType: 'coordinates',
    coordinateSystem,
    coordinatesEntry,
    coordinates: siteDetails.coordinates,
    circleWidth: siteDetails.circleWidth
  }

  // Handle polygon sites (multiple coordinates)
  if (coordinatesEntry === 'multiple') {
    return {
      ...baseData,
      isPolygonSite: true,
      polygonCoordinates: getPolygonCoordinatesDisplayData(
        siteDetails,
        coordinateSystem
      )
    }
  }

  // Handle circular sites (single coordinate + width)
  return {
    ...baseData,
    isPolygonSite: false,
    coordinateDisplayText: getCoordinateDisplayText(
      siteDetails,
      coordinateSystem
    ),
    circleWidth: siteDetails.circleWidth
  }
}
export const processSiteDetails = (exemption, id, request) => {
  if (!exemption.siteDetails?.length) {
    return null
  }

  const siteDetails = getSiteDetailsBySite(exemption)

  const { coordinatesType } = siteDetails

  if (coordinatesType === 'file') {
    return processFileUploadSiteDetails(exemption, id, request)
  }

  return processManualSiteDetails(exemption)
}
