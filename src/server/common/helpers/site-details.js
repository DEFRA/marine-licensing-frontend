import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'

/**
 * Standard error messages for coordinate validation
 * These can be used across different coordinate validation contexts
 */
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
    EASTINGS_REQUIRED: 'Enter the eastings',
    EASTINGS_NON_NUMERIC: 'Eastings must be a number',
    EASTINGS_LENGTH: 'Eastings must be 6 digits',
    EASTINGS_POSITIVE_NUMBER:
      'Eastings must be a positive 6-digit number, like 123456',
    EASTINGS_WHOLE_NUMBER: 'Eastings must be a whole number',
    NORTHINGS_REQUIRED: 'Enter the northings',
    NORTHINGS_NON_NUMERIC: 'Northings must be a number',
    NORTHINGS_LENGTH: 'Northings must be 6 or 7 digits',
    NORTHINGS_POSITIVE_NUMBER:
      'Northings must be a positive 6 or 7-digit number, like 123456',
    NORTHINGS_WHOLE_NUMBER: 'Northings must be a whole number'
  }
}

/**
 * Generate point-specific error message for multiple coordinates
 * @param {string} baseMessage - Base error message
 * @param {number} index - Coordinate index
 * @returns {string} Point-specific error message
 */
export const generatePointSpecificErrorMessage = (baseMessage, index) => {
  const pointName = index === 0 ? 'start and end point' : `point ${index + 1}`

  // Map generic error messages to point-specific ones
  const messageMap = {
    'Enter the latitude': `Enter the latitude of ${pointName}`,
    'Enter the longitude': `Enter the longitude of ${pointName}`,
    'Enter the eastings': `Enter the eastings of ${pointName}`,
    'Enter the northings': `Enter the northings of ${pointName}`,
    'Latitude must be a number': `Latitude of ${pointName} must be a number`,
    'Longitude must be a number': `Longitude of ${pointName} must be a number`,
    'Eastings must be a number': `Eastings of ${pointName} must be a number`,
    'Northings must be a number': `Northings of ${pointName} must be a number`,
    'Latitude must be between -90 and 90': `Latitude of ${pointName} must be between -90 and 90`,
    'Longitude must be between -180 and 180': `Longitude of ${pointName} must be between -180 and 180`,
    'Eastings must be 6 digits': `Eastings of ${pointName} must be 6 digits`,
    'Northings must be 6 or 7 digits': `Northings of ${pointName} must be 6 or 7 digits`,
    'Latitude must include 6 decimal places, like 55.019889': `Latitude of ${pointName} must include 6 decimal places, like 55.019889`,
    'Longitude must include 6 decimal places, like -1.399500': `Longitude of ${pointName} must include 6 decimal places, like -1.399500`,
    'Eastings must be a whole number': `Eastings of ${pointName} must be a whole number`,
    'Northings must be a whole number': `Northings of ${pointName} must be a whole number`,
    'Eastings must be a positive 6-digit number, like 123456': `Eastings of ${pointName} must be a positive 6-digit number, like 123456`,
    'Northings must be a positive 6 or 7-digit number, like 123456': `Northings of ${pointName} must be a positive 6 or 7-digit number, like 123456`
  }

  return messageMap[baseMessage] || baseMessage
}

/**
 * Create site details data JSON for map visualization
 * @param {object} siteDetails - Site details object containing coordinate and file information
 * @param {string} coordinateSystem - Coordinate system identifier ('wgs84' or 'osgb36')
 * @returns {string} JSON string containing site details data for map
 */
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
