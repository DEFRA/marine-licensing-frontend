import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'

export const getSiteDetailsBackLink = (previousPage) => {
  if (!previousPage || !URL.canParse(previousPage)) {
    return routes.TASK_LIST
  }

  const url = new URL(previousPage)
  const previousPath = url.pathname

  if (previousPath === routes.TASK_LIST) {
    return routes.TASK_LIST
  }

  return routes.WIDTH_OF_SITE
}

export const getReviewSummaryText = (siteDetails) => {
  const { coordinatesEntry, coordinatesType } = siteDetails

  if (coordinatesEntry === 'single' && coordinatesType === 'coordinates') {
    return 'Manually enter one set of coordinates and a width to create a circular site'
  }

  return ''
}

export const getCoordinateSystemText = (coordinateSystem) => {
  if (!coordinateSystem) {
    return ''
  }

  return coordinateSystem === COORDINATE_SYSTEMS.WGS84
    ? 'WGS84 (World Geodetic System 1984)\nLatitude and longitude'
    : 'OSGB36 (National Grid)\nEastings and Northings'
}

export const getCoordinateDisplayText = (siteDetails, coordinateSystem) => {
  const { coordinates } = siteDetails

  if (!coordinates || !coordinateSystem) {
    return ''
  }

  return coordinateSystem === COORDINATE_SYSTEMS.WGS84
    ? `${coordinates.latitude}, ${coordinates.longitude}`
    : `${coordinates.eastings}, ${coordinates.northings}`
}

export const getFileUploadSummaryData = (exemption) => {
  const siteDetails = exemption.siteDetails || {}
  const uploadedFile = siteDetails.uploadedFile || {}
  const geoJSON = siteDetails.geoJSON || {}

  // Parse coordinates from geoJSON instead of using extractedCoordinates
  let coordinates = []
  if (geoJSON.features && Array.isArray(geoJSON.features)) {
    coordinates = geoJSON.features.map((feature) => ({
      type: feature.geometry?.type || '',
      coordinates: feature.geometry?.coordinates || []
    }))
  }

  // Determine file type display text
  let fileTypeText = ''
  if (siteDetails.fileUploadType === 'kml') {
    fileTypeText = 'KML'
  } else if (siteDetails.fileUploadType === 'shapefile') {
    fileTypeText = 'Shapefile'
  } else {
    throw new Error('Unsupported file type for site details')
  }

  return {
    method: 'Upload a file with the coordinates of the site',
    fileType: fileTypeText,
    filename: uploadedFile.filename || '',
    coordinates
  }
}

export const getFileUploadBackLink = (previousPage) => {
  if (!previousPage || !URL.canParse(previousPage)) {
    return routes.FILE_UPLOAD
  }

  const url = new URL(previousPage)
  const previousPath = url.pathname

  // If coming from task list, return to task list
  if (previousPath === routes.TASK_LIST) {
    return routes.TASK_LIST
  }

  // Otherwise, return to file upload page
  return routes.FILE_UPLOAD
}
