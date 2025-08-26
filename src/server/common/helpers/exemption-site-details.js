import {
  getCoordinateSystemText,
  getCoordinateDisplayText,
  getReviewSummaryText,
  getFileUploadSummaryData,
  getPolygonCoordinatesDisplayData
} from '~/src/server/exemption/site-details/review-site-details/utils.js'

export const errorMessages = {
  FILE_UPLOAD_DATA_ERROR: 'Error getting file upload summary data'
}

/**
 * Processes file upload site details with error handling
 * @param {object} exemption - Exemption data
 * @param {string} id - Exemption ID
 * @param {object} request - Hapi request object
 * @returns {object} Processed site details for file upload
 */
export const processFileUploadSiteDetails = (exemption, id, request) => {
  try {
    const fileUploadData = getFileUploadSummaryData(exemption)
    return {
      ...exemption.siteDetails,
      isFileUpload: true,
      method: fileUploadData.method,
      fileType: fileUploadData.fileType,
      filename: fileUploadData.filename
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
    return {
      ...exemption.siteDetails,
      isFileUpload: true,
      method: 'Upload a file with the coordinates of the site',
      fileType:
        exemption.siteDetails.fileUploadType === 'kml' ? 'KML' : 'Shapefile',
      filename: exemption.siteDetails.uploadedFile?.filename || 'Unknown file'
    }
  }
}

/**
 * Processes manual coordinate site details
 * @param {object} exemption - Exemption data
 * @returns {object} Processed site details for manual coordinates
 */
export const processManualSiteDetails = (exemption) => {
  const { siteDetails } = exemption
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

/**
 * Processes site details based on coordinates type
 * @param {object} exemption - Exemption data
 * @param {string} id - Exemption ID
 * @param {object} request - Hapi request object
 * @returns {object|null} Processed site details or null
 */
export const processSiteDetails = (exemption, id, request) => {
  if (!exemption.siteDetails) {
    return null
  }

  const { coordinatesType } = exemption.siteDetails

  if (coordinatesType === 'file') {
    return processFileUploadSiteDetails(exemption, id, request)
  }

  return processManualSiteDetails(exemption)
}
