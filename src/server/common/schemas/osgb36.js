import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'
import {
  COORDINATE_ERROR_MESSAGES,
  createPointSpecificErrorMessages
} from '~/src/server/common/helpers/site-details.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import joi from 'joi'

export const MIN_EASTINGS_LENGTH = 100000
export const MAX_EASTINGS_LENGTH = 999999
export const MIN_NORTHINGS_LENGTH = 100000
export const MAX_NORTHINGS_LENGTH = 9999999

export const validateCoordinates = (value, helpers, type) => {
  const coordinate = Number(value)
  if (isNaN(coordinate)) {
    return helpers.error(JOI_ERRORS.NUMBER_BASE)
  }

  if (coordinate <= 0) {
    return helpers.error(JOI_ERRORS.NUMBER_POSITIVE)
  }

  if (
    type === 'eastings' &&
    (coordinate < MIN_EASTINGS_LENGTH || coordinate > MAX_EASTINGS_LENGTH)
  ) {
    return helpers.error(JOI_ERRORS.NUMBER_RANGE)
  }

  if (
    type === 'northings' &&
    (coordinate < MIN_NORTHINGS_LENGTH || coordinate > MAX_NORTHINGS_LENGTH)
  ) {
    return helpers.error(JOI_ERRORS.NUMBER_RANGE)
  }

  return value
}

/**
 * Create a base OSGB36 coordinate schema with configurable decimal support and error messages
 * @param {boolean} allowDecimals - Whether to allow decimal values
 * @param {object} errorMessages - Custom error messages to use
 * @returns {object} Joi schema object with eastings and northings validation
 */
const createBaseOsgb36Schema = (
  allowDecimals = false,
  errorMessages = COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.OSGB36]
) => {
  const pattern = allowDecimals ? /^[0-9.]+$/ : /^[0-9]+$/
  const northingsPattern = allowDecimals ? /^-?[0-9.]+$/ : /^[0-9]+$/

  return joi.object({
    eastings: joi
      .string()
      .required()
      .pattern(pattern)
      .custom((value, helpers) =>
        validateCoordinates(value, helpers, 'eastings')
      )
      .messages({
        [JOI_ERRORS.STRING_EMPTY]: errorMessages.EASTINGS_REQUIRED,
        [JOI_ERRORS.STRING_PATTERN_BASE]: allowDecimals
          ? errorMessages.EASTINGS_NON_NUMERIC
          : errorMessages.EASTINGS_WHOLE_NUMBER,
        [JOI_ERRORS.NUMBER_BASE]: errorMessages.EASTINGS_NON_NUMERIC,
        [JOI_ERRORS.NUMBER_POSITIVE]: errorMessages.EASTINGS_POSITIVE_NUMBER,
        [JOI_ERRORS.NUMBER_RANGE]: errorMessages.EASTINGS_LENGTH,
        [JOI_ERRORS.ANY_REQUIRED]: errorMessages.EASTINGS_REQUIRED
      }),
    northings: joi
      .string()
      .required()
      .pattern(northingsPattern)
      .custom((value, helpers) =>
        validateCoordinates(value, helpers, 'northings')
      )
      .messages({
        [JOI_ERRORS.STRING_EMPTY]: errorMessages.NORTHINGS_REQUIRED,
        [JOI_ERRORS.STRING_PATTERN_BASE]: allowDecimals
          ? errorMessages.NORTHINGS_NON_NUMERIC
          : errorMessages.NORTHINGS_WHOLE_NUMBER,
        [JOI_ERRORS.NUMBER_BASE]: errorMessages.NORTHINGS_NON_NUMERIC,
        [JOI_ERRORS.NUMBER_POSITIVE]: errorMessages.NORTHINGS_POSITIVE_NUMBER,
        [JOI_ERRORS.NUMBER_RANGE]: errorMessages.NORTHINGS_LENGTH,
        [JOI_ERRORS.ANY_REQUIRED]: errorMessages.NORTHINGS_REQUIRED
      })
  })
}

// Schema that allows decimals (for centre coordinates)
export const osgb36ValidationSchema = createBaseOsgb36Schema(true, {
  EASTINGS_REQUIRED: 'EASTINGS_REQUIRED',
  EASTINGS_NON_NUMERIC: 'EASTINGS_NON_NUMERIC',
  EASTINGS_POSITIVE_NUMBER: 'EASTINGS_POSITIVE_NUMBER',
  EASTINGS_LENGTH: 'EASTINGS_LENGTH',
  NORTHINGS_REQUIRED: 'NORTHINGS_REQUIRED',
  NORTHINGS_NON_NUMERIC: 'NORTHINGS_NON_NUMERIC',
  NORTHINGS_POSITIVE_NUMBER: 'NORTHINGS_POSITIVE_NUMBER',
  NORTHINGS_LENGTH: 'NORTHINGS_LENGTH'
})

// Schema that only allows integers (for multiple coordinates)
export const osgb36IntegerValidationSchema = createBaseOsgb36Schema(false)

/**
 * Create an OSGB36 validation schema for a specific point
 * @param {string} pointName - Name of the point for error messages (e.g., "the start and end point", "point 2")
 * @returns {object} Joi schema for OSGB36 coordinate validation
 */
export const createOsgb36PointSchema = (pointName) => {
  const pointSpecificMessages = createPointSpecificErrorMessages(
    pointName,
    COORDINATE_SYSTEMS.OSGB36
  )
  return createBaseOsgb36Schema(false, pointSpecificMessages)
}

/**
 * Create an eastings validation schema for a specific point
 * @param {string} pointName - Name of the point for error messages (e.g., "the start and end point", "point 2")
 * @returns {object} Joi schema for eastings validation
 * @deprecated Use createOsgb36PointSchema instead - this function is kept for backward compatibility
 */
export const createEastingsSchema = (pointName) => {
  const pointSpecificMessages = createPointSpecificErrorMessages(
    pointName,
    COORDINATE_SYSTEMS.OSGB36
  )
  return joi
    .string()
    .required()
    .pattern(/^[0-9]+$/)
    .custom((value, helpers) => validateCoordinates(value, helpers, 'eastings'))
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: pointSpecificMessages.EASTINGS_REQUIRED,
      [JOI_ERRORS.ANY_REQUIRED]: pointSpecificMessages.EASTINGS_REQUIRED,
      [JOI_ERRORS.STRING_PATTERN_BASE]:
        pointSpecificMessages.EASTINGS_WHOLE_NUMBER,
      [JOI_ERRORS.NUMBER_BASE]: pointSpecificMessages.EASTINGS_NON_NUMERIC,
      [JOI_ERRORS.NUMBER_POSITIVE]:
        pointSpecificMessages.EASTINGS_POSITIVE_NUMBER,
      [JOI_ERRORS.NUMBER_RANGE]: pointSpecificMessages.EASTINGS_LENGTH
    })
}

/**
 * Create a northings validation schema for a specific point
 * @param {string} pointName - Name of the point for error messages (e.g., "the start and end point", "point 2")
 * @returns {object} Joi schema for northings validation
 * @deprecated Use createOsgb36PointSchema instead - this function is kept for backward compatibility
 */
export const createNorthingsSchema = (pointName) => {
  const pointSpecificMessages = createPointSpecificErrorMessages(
    pointName,
    COORDINATE_SYSTEMS.OSGB36
  )
  return joi
    .string()
    .required()
    .pattern(/^[0-9]+$/)
    .custom((value, helpers) =>
      validateCoordinates(value, helpers, 'northings')
    )
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: pointSpecificMessages.NORTHINGS_REQUIRED,
      [JOI_ERRORS.ANY_REQUIRED]: pointSpecificMessages.NORTHINGS_REQUIRED,
      [JOI_ERRORS.STRING_PATTERN_BASE]:
        pointSpecificMessages.NORTHINGS_WHOLE_NUMBER,
      [JOI_ERRORS.NUMBER_BASE]: pointSpecificMessages.NORTHINGS_NON_NUMERIC,
      [JOI_ERRORS.NUMBER_POSITIVE]:
        pointSpecificMessages.NORTHINGS_POSITIVE_NUMBER,
      [JOI_ERRORS.NUMBER_RANGE]: pointSpecificMessages.NORTHINGS_LENGTH
    })
}

/**
 * Create OSGB36 multiple coordinates validation schema
 * Uses Joi array validation for clean, simple validation
 * @returns {object} Joi validation schema
 */
export const createOsgb36MultipleCoordinatesSchema = () => {
  return joi
    .object({
      coordinates: joi
        .array()
        .min(3)
        .items(osgb36IntegerValidationSchema)
        .required()
        .messages({
          'array.min': 'You must provide at least 3 coordinate points',
          'any.required': 'Coordinates are required'
        })
    })
    .unknown(true)
}
