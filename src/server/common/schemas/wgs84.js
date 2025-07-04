import joi from 'joi'
import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'

export const MIN_LATITUDE = -90
export const MAX_LATITUDE = 90
export const MIN_LONGITUDE = -180
export const MAX_LONGITUDE = 180
export const LAT_LONG_DECIMAL_PLACES = 6
export const MIN_COORDINATE_POINTS = 3

const isLatitudeInRange = (coordinate) =>
  coordinate >= MIN_LATITUDE && coordinate <= MAX_LATITUDE

const isLongitudeInRange = (coordinate) =>
  coordinate >= MIN_LONGITUDE && coordinate <= MAX_LONGITUDE

export const validateDecimals = (value, helpers) => {
  const decimalParts = value.split('.')
  if (
    decimalParts.length !== 2 ||
    decimalParts[1].length !== LAT_LONG_DECIMAL_PLACES
  ) {
    return helpers.error(JOI_ERRORS.NUMBER_DECIMAL)
  }

  return value
}

export const validateCoordinates = (value, helpers, type) => {
  const coordinate = Number(value)
  if (isNaN(coordinate)) {
    return helpers.error(JOI_ERRORS.NUMBER_BASE)
  }

  if (type === 'latitude' && !isLatitudeInRange(coordinate)) {
    return helpers.error(JOI_ERRORS.NUMBER_RANGE)
  }

  if (type === 'longitude' && !isLongitudeInRange(coordinate)) {
    return helpers.error(JOI_ERRORS.NUMBER_RANGE)
  }

  return value
}

export const wgs84ValidationSchema = joi.object({
  latitude: joi
    .string()
    .required()
    .pattern(/^-?[\d.]+$/)
    .custom((value, helpers) => validateCoordinates(value, helpers, 'latitude'))
    .custom((value, helpers) => validateDecimals(value, helpers))
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'LATITUDE_REQUIRED',
      [JOI_ERRORS.ANY_REQUIRED]: 'LATITUDE_REQUIRED',
      [JOI_ERRORS.STRING_PATTERN_BASE]: 'LATITUDE_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_BASE]: 'LATITUDE_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_RANGE]: 'LATITUDE_LENGTH',
      [JOI_ERRORS.NUMBER_DECIMAL]: 'LATITUDE_DECIMAL_PLACES'
    }),
  longitude: joi
    .string()
    .required()
    .pattern(/^-?[\d.]+$/)
    .custom((value, helpers) =>
      validateCoordinates(value, helpers, 'longitude')
    )
    .custom((value, helpers) => validateDecimals(value, helpers))
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'LONGITUDE_REQUIRED',
      [JOI_ERRORS.ANY_REQUIRED]: 'LONGITUDE_REQUIRED',
      [JOI_ERRORS.STRING_PATTERN_BASE]: 'LONGITUDE_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_BASE]: 'LONGITUDE_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_RANGE]: 'LONGITUDE_LENGTH',
      [JOI_ERRORS.NUMBER_DECIMAL]: 'LONGITUDE_DECIMAL_PLACES'
    })
})

/**
 * Create a latitude validation schema for a specific point
 * @param {string} pointName - Name of the point for error messages (e.g., "the start and end point", "point 2")
 * @returns {object} Joi schema for latitude validation
 */
export const createLatitudeSchema = (pointName) => {
  return joi
    .string()
    .required()
    .pattern(/^-?[\d.]+$/)
    .custom((value, helpers) => validateCoordinates(value, helpers, 'latitude'))
    .custom((value, helpers) => validateDecimals(value, helpers))
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: `Enter the latitude of ${pointName}`,
      [JOI_ERRORS.ANY_REQUIRED]: `Enter the latitude of ${pointName}`,
      [JOI_ERRORS.STRING_PATTERN_BASE]: `Latitude of ${pointName} must be a number`,
      [JOI_ERRORS.NUMBER_BASE]: `Latitude of ${pointName} must be a number`,
      [JOI_ERRORS.NUMBER_RANGE]: `Latitude of ${pointName} must be between -90 and 90`,
      [JOI_ERRORS.NUMBER_DECIMAL]: `Latitude of ${pointName} must include 6 decimal places, like 55.019889`
    })
}

/**
 * Create a longitude validation schema for a specific point
 * @param {string} pointName - Name of the point for error messages (e.g., "the start and end point", "point 2")
 * @returns {object} Joi schema for longitude validation
 */
export const createLongitudeSchema = (pointName) => {
  return joi
    .string()
    .required()
    .pattern(/^-?[\d.]+$/)
    .custom((value, helpers) =>
      validateCoordinates(value, helpers, 'longitude')
    )
    .custom((value, helpers) => validateDecimals(value, helpers))
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: `Enter the longitude of ${pointName}`,
      [JOI_ERRORS.ANY_REQUIRED]: `Enter the longitude of ${pointName}`,
      [JOI_ERRORS.STRING_PATTERN_BASE]: `Longitude of ${pointName} must be a number`,
      [JOI_ERRORS.NUMBER_BASE]: `Longitude of ${pointName} must be a number`,
      [JOI_ERRORS.NUMBER_RANGE]: `Longitude of ${pointName} must be between -180 and 180`,
      [JOI_ERRORS.NUMBER_DECIMAL]: `Longitude of ${pointName} must include 6 decimal places, like -1.399500`
    })
}

// WGS84 validation schema with user-friendly error messages for multiple coordinates
export const wgs84MultipleCoordinateItemSchema = joi.object({
  latitude: joi
    .string()
    .required()
    .pattern(/^-?[\d.]+$/)
    .custom((value, helpers) => validateCoordinates(value, helpers, 'latitude'))
    .custom((value, helpers) => validateDecimals(value, helpers))
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'Enter the latitude',
      [JOI_ERRORS.ANY_REQUIRED]: 'Enter the latitude',
      [JOI_ERRORS.STRING_PATTERN_BASE]: 'Latitude must be a number',
      [JOI_ERRORS.NUMBER_BASE]: 'Latitude must be a number',
      [JOI_ERRORS.NUMBER_RANGE]: 'Latitude must be between -90 and 90',
      [JOI_ERRORS.NUMBER_DECIMAL]:
        'Latitude must include 6 decimal places, like 55.019889'
    }),
  longitude: joi
    .string()
    .required()
    .pattern(/^-?[\d.]+$/)
    .custom((value, helpers) =>
      validateCoordinates(value, helpers, 'longitude')
    )
    .custom((value, helpers) => validateDecimals(value, helpers))
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'Enter the longitude',
      [JOI_ERRORS.ANY_REQUIRED]: 'Enter the longitude',
      [JOI_ERRORS.STRING_PATTERN_BASE]: 'Longitude must be a number',
      [JOI_ERRORS.NUMBER_BASE]: 'Longitude must be a number',
      [JOI_ERRORS.NUMBER_RANGE]: 'Longitude must be between -180 and 180',
      [JOI_ERRORS.NUMBER_DECIMAL]:
        'Longitude must include 6 decimal places, like -1.399500'
    })
})

/**
 * Create WGS84 multiple coordinates validation schema
 * Uses Joi array validation for clean, simple validation
 * @returns {object} Joi validation schema
 */
export const createWgs84MultipleCoordinatesSchema = () => {
  return joi
    .object({
      coordinates: joi
        .array()
        .min(MIN_COORDINATE_POINTS)
        .items(wgs84MultipleCoordinateItemSchema)
        .required()
        .messages({
          'array.min': `You must provide at least ${MIN_COORDINATE_POINTS} coordinate points`,
          'any.required': 'Coordinates are required'
        })
    })
    .unknown(true)
}
