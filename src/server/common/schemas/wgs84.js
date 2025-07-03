import joi from 'joi'
import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'

const MIN_LATITUDE = -90
const MAX_LATITUDE = 90
const MIN_LONGITUDE = -180
const MAX_LONGITUDE = 180
const LAT_LONG_DECIMAL_PLACES = 6

const validateDecimals = (value, helpers) => {
  const decimalParts = value.split('.')
  if (
    decimalParts.length !== 2 ||
    decimalParts[1].length !== LAT_LONG_DECIMAL_PLACES
  ) {
    return helpers.error(JOI_ERRORS.NUMBER_DECIMAL)
  }
  return value
}

const validateCoordinates = (value, helpers, type) => {
  const coordinate = Number(value)
  if (isNaN(coordinate)) {
    return helpers.error(JOI_ERRORS.NUMBER_BASE)
  }

  if (type === 'latitude') {
    if (coordinate < MIN_LATITUDE || coordinate > MAX_LATITUDE) {
      return helpers.error(JOI_ERRORS.NUMBER_RANGE)
    }
  } else if (type === 'longitude') {
    if (coordinate < MIN_LONGITUDE || coordinate > MAX_LONGITUDE) {
      return helpers.error(JOI_ERRORS.NUMBER_RANGE)
    }
  }

  return value
}

export const wgs84ValidationSchema = joi.object({
  latitude: joi
    .string()
    .required()
    .pattern(/^-?[0-9.]+$/)
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
    .pattern(/^-?[0-9.]+$/)
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
 * @param {string} pointName - Name of the point for error messages (e.g., "point 1", "point 2")
 * @returns {object} Joi schema for latitude validation
 */
export const createLatitudeSchema = (pointName) => {
  return joi
    .string()
    .required()
    .pattern(/^-?[0-9.]+$/)
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
 * @param {string} pointName - Name of the point for error messages (e.g., "point 1", "point 2")
 * @returns {object} Joi schema for longitude validation
 */
export const createLongitudeSchema = (pointName) => {
  return joi
    .string()
    .required()
    .pattern(/^-?[0-9.]+$/)
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
