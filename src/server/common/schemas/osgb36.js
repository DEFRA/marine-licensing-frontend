import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'
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

export const validateInteger = (value, helpers) => {
  if (value.includes('.')) {
    return helpers.error(JOI_ERRORS.NUMBER_INTEGER)
  }
  return value
}

export const osgb36ValidationSchema = joi.object({
  eastings: joi
    .string()
    .required()
    .pattern(/^[0-9.]+$/)
    .custom((value, helpers) => validateCoordinates(value, helpers, 'eastings'))
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'EASTINGS_REQUIRED',
      [JOI_ERRORS.STRING_PATTERN_BASE]: 'EASTINGS_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_BASE]: 'EASTINGS_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_POSITIVE]: 'EASTINGS_POSITIVE_NUMBER',
      [JOI_ERRORS.NUMBER_RANGE]: 'EASTINGS_LENGTH',
      [JOI_ERRORS.ANY_REQUIRED]: 'EASTINGS_REQUIRED'
    }),
  northings: joi
    .string()
    .required()
    .pattern(/^[0-9.]+$/)
    .custom((value, helpers) =>
      validateCoordinates(value, helpers, 'northings')
    )
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'NORTHINGS_REQUIRED',
      [JOI_ERRORS.STRING_PATTERN_BASE]: 'NORTHINGS_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_BASE]: 'NORTHINGS_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_POSITIVE]: 'NORTHINGS_POSITIVE_NUMBER',
      [JOI_ERRORS.NUMBER_RANGE]: 'NORTHINGS_LENGTH',
      [JOI_ERRORS.ANY_REQUIRED]: 'NORTHINGS_REQUIRED'
    })
})

// Schema for multiple coordinates with integer validation
export const osgb36IntegerValidationSchema = joi.object({
  eastings: joi
    .string()
    .required()
    .pattern(/^[0-9.]+$/)
    .custom((value, helpers) => validateInteger(value, helpers))
    .custom((value, helpers) => validateCoordinates(value, helpers, 'eastings'))
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'Enter the eastings',
      [JOI_ERRORS.STRING_PATTERN_BASE]: 'Eastings must be a number',
      [JOI_ERRORS.NUMBER_BASE]: 'Eastings must be a number',
      [JOI_ERRORS.NUMBER_INTEGER]: 'Eastings must be a whole number',
      [JOI_ERRORS.NUMBER_POSITIVE]:
        'Eastings must be a positive 6-digit number, like 123456',
      [JOI_ERRORS.NUMBER_RANGE]: 'Eastings must be 6 digits',
      [JOI_ERRORS.ANY_REQUIRED]: 'Enter the eastings'
    }),
  northings: joi
    .string()
    .required()
    .pattern(/^[0-9.]+$/)
    .custom((value, helpers) => validateInteger(value, helpers))
    .custom((value, helpers) =>
      validateCoordinates(value, helpers, 'northings')
    )
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'Enter the northings',
      [JOI_ERRORS.STRING_PATTERN_BASE]: 'Northings must be a number',
      [JOI_ERRORS.NUMBER_BASE]: 'Northings must be a number',
      [JOI_ERRORS.NUMBER_INTEGER]: 'Northings must be a whole number',
      [JOI_ERRORS.NUMBER_POSITIVE]:
        'Northings must be a positive 6 or 7-digit number, like 123456',
      [JOI_ERRORS.NUMBER_RANGE]: 'Northings must be 6 or 7 digits',
      [JOI_ERRORS.ANY_REQUIRED]: 'Enter the northings'
    })
})

/**
 * Create an eastings validation schema for a specific point
 * @param {string} pointName - Name of the point for error messages (e.g., "the start and end point", "point 2")
 * @returns {object} Joi schema for eastings validation
 */
export const createEastingsSchema = (pointName) => {
  return joi
    .string()
    .required()
    .pattern(/^[0-9.]+$/)
    .custom((value, helpers) => validateInteger(value, helpers))
    .custom((value, helpers) => validateCoordinates(value, helpers, 'eastings'))
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: `Enter the eastings of ${pointName}`,
      [JOI_ERRORS.ANY_REQUIRED]: `Enter the eastings of ${pointName}`,
      [JOI_ERRORS.STRING_PATTERN_BASE]: `Eastings of ${pointName} must be a number`,
      [JOI_ERRORS.NUMBER_BASE]: `Eastings of ${pointName} must be a number`,
      [JOI_ERRORS.NUMBER_INTEGER]: `Eastings of ${pointName} must be a whole number`,
      [JOI_ERRORS.NUMBER_POSITIVE]: `Eastings of ${pointName} must be a positive 6-digit number, like 123456`,
      [JOI_ERRORS.NUMBER_RANGE]: `Eastings of ${pointName} must be 6 digits`
    })
}

/**
 * Create a northings validation schema for a specific point
 * @param {string} pointName - Name of the point for error messages (e.g., "the start and end point", "point 2")
 * @returns {object} Joi schema for northings validation
 */
export const createNorthingsSchema = (pointName) => {
  return joi
    .string()
    .required()
    .pattern(/^[0-9.]+$/)
    .custom((value, helpers) => validateInteger(value, helpers))
    .custom((value, helpers) =>
      validateCoordinates(value, helpers, 'northings')
    )
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: `Enter the northings of ${pointName}`,
      [JOI_ERRORS.ANY_REQUIRED]: `Enter the northings of ${pointName}`,
      [JOI_ERRORS.STRING_PATTERN_BASE]: `Northings of ${pointName} must be a number`,
      [JOI_ERRORS.NUMBER_BASE]: `Northings of ${pointName} must be a number`,
      [JOI_ERRORS.NUMBER_INTEGER]: `Northings of ${pointName} must be a whole number`,
      [JOI_ERRORS.NUMBER_POSITIVE]: `Northings of ${pointName} must be a positive 6 or 7-digit number, like 123456`,
      [JOI_ERRORS.NUMBER_RANGE]: `Northings of ${pointName} must be 6 or 7 digits`
    })
}
