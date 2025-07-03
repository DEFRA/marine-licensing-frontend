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
 * Create point-specific error messages for a coordinate field
 * @param {string} pointName - Name of the point (e.g., "the start and end point", "point 2")
 * @param {string} coordinateSystem - The coordinate system (WGS84 or OSGB36)
 * @returns {object} Object with point-specific error messages
 */
export const createPointSpecificErrorMessages = (
  pointName,
  coordinateSystem
) => {
  if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
    return {
      LATITUDE_REQUIRED: `Enter the latitude of ${pointName}`,
      LATITUDE_NON_NUMERIC: `Latitude of ${pointName} must be a number`,
      LATITUDE_LENGTH: `Latitude of ${pointName} must be between -90 and 90`,
      LATITUDE_DECIMAL_PLACES: `Latitude of ${pointName} must include 6 decimal places, like 55.019889`,
      LONGITUDE_REQUIRED: `Enter the longitude of ${pointName}`,
      LONGITUDE_NON_NUMERIC: `Longitude of ${pointName} must be a number`,
      LONGITUDE_LENGTH: `Longitude of ${pointName} must be between -180 and 180`,
      LONGITUDE_DECIMAL_PLACES: `Longitude of ${pointName} must include 6 decimal places, like -1.399500`
    }
  } else {
    return {
      EASTINGS_REQUIRED: `Enter the eastings of ${pointName}`,
      EASTINGS_NON_NUMERIC: `Eastings of ${pointName} must be a number`,
      EASTINGS_LENGTH: `Eastings of ${pointName} must be 6 digits`,
      EASTINGS_POSITIVE_NUMBER: `Eastings of ${pointName} must be a positive 6-digit number, like 123456`,
      EASTINGS_WHOLE_NUMBER: `Eastings of ${pointName} must be a whole number`,
      NORTHINGS_REQUIRED: `Enter the northings of ${pointName}`,
      NORTHINGS_NON_NUMERIC: `Northings of ${pointName} must be a number`,
      NORTHINGS_LENGTH: `Northings of ${pointName} must be 6 or 7 digits`,
      NORTHINGS_POSITIVE_NUMBER: `Northings of ${pointName} must be a positive 6 or 7-digit number, like 123456`,
      NORTHINGS_WHOLE_NUMBER: `Northings of ${pointName} must be a whole number`
    }
  }
}
