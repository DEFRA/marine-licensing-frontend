import {
  getCoordinateSystemText,
  getCoordinateDisplayText,
  getFileUploadSummaryData,
  getPolygonCoordinatesDisplayData
} from '#src/server/exemption/site-details/review-site-details/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import { formatDate } from '#src/server/common/helpers/dates/date-utils.js'
import { createSiteDetailsDataJson } from '#src/server/common/helpers/site-details.js'

export const errorMessages = {
  FILE_UPLOAD_DATA_ERROR: 'Error getting file upload summary data'
}

const getActivityDatesText = (activityDates) => {
  if (!activityDates?.start || !activityDates?.end) {
    return null
  }
  return `${formatDate(activityDates.start)} to ${formatDate(activityDates.end)}`
}

export const processFileUploadSiteDetails = (
  exemption,
  id,
  request,
  siteIndex = 0
) => {
  try {
    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)
    const fileUploadData = getFileUploadSummaryData({
      ...exemption,
      siteDetails
    })

    return {
      ...siteDetails,
      isFileUpload: true,
      method: 'Upload a file with the coordinates of the site',
      fileType: fileUploadData.fileUploadType,
      filename: fileUploadData.uploadedFile.filename
    }
  } catch (error) {
    request.logger.error(
      {
        err: error,
        exemptionId: id
      },
      errorMessages.FILE_UPLOAD_DATA_ERROR
    )
    // Fallback to basic site details if file upload data unavailable
    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)

    return {
      ...siteDetails,
      isFileUpload: true,
      method: 'Upload a file with the coordinates of the site',
      fileType: siteDetails.fileUploadType === 'kml' ? 'KML' : 'Shapefile',
      filename: siteDetails.uploadedFile?.filename || 'Unknown file'
    }
  }
}

export const processManualSiteDetails = (exemption, siteIndex = 0) => {
  const siteDetails = getSiteDetailsBySite(exemption, siteIndex)
  const { coordinateSystem, coordinatesEntry } = siteDetails

  const baseData = {
    isFileUpload: false,
    method: 'Enter the coordinates of the site manually',
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
    return []
  }

  const { multipleSiteDetails, siteDetails } = exemption
  const { multipleSitesEnabled } = multipleSiteDetails

  const showActivityDates = siteHasUniqueDate(multipleSiteDetails)
  const showActivityDescription = siteHasUniqueDescription(multipleSiteDetails)

  return siteDetails.map((site, index) => {
    const { coordinatesType } = site

    let processedSite

    if (coordinatesType === 'file') {
      processedSite = processFileUploadSiteDetails(
        exemption,
        id,
        request,
        index
      )
    } else {
      processedSite = processManualSiteDetails(exemption, index)
    }

    if (multipleSitesEnabled) {
      processedSite.siteName = site.siteName
    }

    processedSite.activityDates = getActivityDatesText(site.activityDates)
    processedSite.showActivityDates = showActivityDates

    processedSite.activityDescription = site.activityDescription
    processedSite.showActivityDescription = showActivityDescription

    processedSite.siteNumber = index + 1

    processedSite.siteDetailsData = createSiteDetailsDataJson(
      processedSite,
      processedSite.coordinateSystem
    )

    return processedSite
  })
}

const siteHasUniqueDate = (multipleSiteDetails) =>
  !multipleSiteDetails.multipleSitesEnabled ||
  multipleSiteDetails.sameActivityDates === 'no'

const siteHasUniqueDescription = (multipleSiteDetails) =>
  !multipleSiteDetails.multipleSitesEnabled ||
  multipleSiteDetails.sameActivityDescription === 'no'

export const getReviewSummaryText = (siteDetails) => {
  const { coordinatesEntry, coordinatesType } = siteDetails

  if (coordinatesEntry === 'single' && coordinatesType === 'coordinates') {
    return 'Enter one set of coordinates and a width to create a circular site'
  }

  if (coordinatesEntry === 'multiple' && coordinatesType === 'coordinates') {
    return 'Enter multiple sets of coordinates to mark the boundary of the site'
  }

  return ''
}
