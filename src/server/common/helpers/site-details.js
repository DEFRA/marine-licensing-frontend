import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
export const COORDINATE_ERROR_MESSAGES = {
  [COORDINATE_SYSTEMS.WGS84]: {
    LATITUDE_REQUIRED: 'Enter the latitude',
    LATITUDE_LENGTH: 'Latitude must be between -90 and 90',
    LATITUDE_NON_NUMERIC: 'Latitude must be a number',
    LATITUDE_DECIMAL_PLACES:
      'Latitude must include 6 decimal places, like 55.019889',
    LONGITUDE_REQUIRED: 'Enter the longitude',
    LONGITUDE_LENGTH: 'Longitude must be between -180 and 180',
    LONGITUDE_NON_NUMERIC: 'Longitude must be a number',
    LONGITUDE_DECIMAL_PLACES:
      'Longitude must include 6 decimal places, like -1.399500'
  },
  [COORDINATE_SYSTEMS.OSGB36]: {
    EASTINGS_REQUIRED: 'Enter the easting',
    EASTINGS_NON_NUMERIC: 'Easting must be a number',
    EASTINGS_LENGTH: 'Easting must be 6 digits',
    EASTINGS_POSITIVE_NUMBER:
      'Easting must be a positive 6-digit number, like 123456',
    EASTINGS_WHOLE_NUMBER: 'Easting must be a whole number',
    NORTHINGS_REQUIRED: 'Enter the northing',
    NORTHINGS_NON_NUMERIC: 'Northing must be a number',
    NORTHINGS_LENGTH: 'Northing must be 6 or 7 digits',
    NORTHINGS_POSITIVE_NUMBER:
      'Northing must be a positive 6 or 7-digit number, like 123456',
    NORTHINGS_WHOLE_NUMBER: 'Northing must be a whole number'
  }
}
export const generatePointSpecificErrorMessage = (baseMessage, index) => {
  const pointName = index === 0 ? 'start and end point' : `point ${index + 1}`

  // Map generic error messages to point-specific ones
  const messageMap = {
    'Enter the latitude': `Enter the latitude of ${pointName}`,
    'Enter the longitude': `Enter the longitude of ${pointName}`,
    'Enter the easting': `Enter the easting of ${pointName}`,
    'Enter the northing': `Enter the northing of ${pointName}`,
    'Latitude must be a number': `Latitude of ${pointName} must be a number`,
    'Longitude must be a number': `Longitude of ${pointName} must be a number`,
    'Easting must be a number': `Easting of ${pointName} must be a number`,
    'Northing must be a number': `Northing of ${pointName} must be a number`,
    'Latitude must be between -90 and 90': `Latitude of ${pointName} must be between -90 and 90`,
    'Longitude must be between -180 and 180': `Longitude of ${pointName} must be between -180 and 180`,
    'Easting must be 6 digits': `Easting of ${pointName} must be 6 digits`,
    'Northing must be 6 or 7 digits': `Northing of ${pointName} must be 6 or 7 digits`,
    'Latitude must include 6 decimal places, like 55.019889': `Latitude of ${pointName} must include 6 decimal places, like 55.019889`,
    'Longitude must include 6 decimal places, like -1.399500': `Longitude of ${pointName} must include 6 decimal places, like -1.399500`,
    'Easting must be a whole number': `Easting of ${pointName} must be a whole number`,
    'Northing must be a whole number': `Northing of ${pointName} must be a whole number`,
    'Easting must be a positive 6-digit number, like 123456': `Easting of ${pointName} must be a positive 6-digit number, like 123456`,
    'Northing must be a positive 6 or 7-digit number, like 123456': `Northing of ${pointName} must be a positive 6 or 7-digit number, like 123456`
  }

  return messageMap[baseMessage] || baseMessage
}
export const createSiteDetailsDataJson = (siteDetails, coordinateSystem) => {
  if (!siteDetails) {
    return JSON.stringify({
      coordinatesType: 'none',
      coordinateSystem: null
    })
  }

  if (siteDetails.coordinatesType === 'file') {
    return JSON.stringify({
      coordinatesType: 'file',
      geoJSON: siteDetails.geoJSON,
      fileUploadType: siteDetails.fileUploadType,
      uploadedFile: siteDetails.uploadedFile
    })
  } else {
    return JSON.stringify({
      coordinatesType: 'coordinates',
      coordinateSystem,
      coordinatesEntry: siteDetails.coordinatesEntry,
      coordinates: siteDetails.coordinates,
      circleWidth: siteDetails.circleWidth
    })
  }
}
