import joi from 'joi'
import { JOI_ERRORS } from '#src/server/common/constants/joi.js'
import {
  POLYGON_MIN_COORDINATE_POINTS,
  OSGB36_CONSTANTS
} from '#src/server/common/constants/exemptions.js'

// Eastings minimum is 000000 and maximum 700000. Unpadded 0 also allowed as a value.
// Northings minimum is 000000 and maximum 1200000. Unpadded 0 also allowed as a value.
// Any value within the ranges has to be 6 characters for eastings or 6/7 characters for northings, and should be left-padded with zeroes to achieve that eg eastings - 000700

const {
  MIN_EASTINGS,
  MAX_EASTINGS,
  MIN_NORTHINGS,
  MAX_NORTHINGS,
  VALID_EASTINGS_LENGTH,
  MIN_VALID_NORTHINGS_LENGTH,
  MAX_VALID_NORTHINGS_LENGTH
} = OSGB36_CONSTANTS

const isEastingsInRange = (value, numericValue) => {
  if (numericValue === 0) {
    return true
  }
  if (value.length !== VALID_EASTINGS_LENGTH) {
    return false
  }
  return numericValue >= MIN_EASTINGS && numericValue <= MAX_EASTINGS
}

const isNorthingsInRange = (value, numericValue) => {
  if (numericValue === 0) {
    return true
  }
  if (
    value.length !== MIN_VALID_NORTHINGS_LENGTH &&
    value.length !== MAX_VALID_NORTHINGS_LENGTH
  ) {
    return false
  }
  return numericValue >= MIN_NORTHINGS && numericValue <= MAX_NORTHINGS
}

const validateCoordinates = (value, helpers, type) => {
  const coordinate = Number(value)
  const isNegative = coordinate < 0

  if (isNegative) {
    return helpers.error(JOI_ERRORS.NUMBER_POSITIVE)
  }

  if (type === 'eastings' && !isEastingsInRange(value, coordinate)) {
    return helpers.error(JOI_ERRORS.NUMBER_RANGE)
  }

  if (type === 'northings' && !isNorthingsInRange(value, coordinate)) {
    return helpers.error(JOI_ERRORS.NUMBER_RANGE)
  }

  return value
}

const validateCoordinatesWithPattern = (value, helpers, type) => {
  const numericPattern = /^-?[0-9.]+$/
  if (!numericPattern.test(value)) {
    return helpers.error(JOI_ERRORS.STRING_PATTERN_BASE)
  }

  return validateCoordinates(value, helpers, type)
}

const capitaliseCoordinateType = (type) =>
  type.charAt(0).toUpperCase() + type.slice(1)

const COORDINATE_CONFIG = {
  eastings: {
    constantPrefix: 'EASTINGS',
    lengthDescription: '6 digits',
    positiveDescription: '6-digit number',
    example: '123456'
  },
  northings: {
    constantPrefix: 'NORTHINGS',
    lengthDescription: '6 or 7 digits',
    positiveDescription: '6 or 7-digit number',
    example: '123456'
  }
}

const createMessages = (coordinateType, messageType, pointName) => {
  const { constantPrefix, lengthDescription, positiveDescription, example } =
    COORDINATE_CONFIG[coordinateType]
  const capitalised = capitaliseCoordinateType(coordinateType)

  const templates = {
    constants: [constantPrefix, '', ''],
    simple: ['', `Enter the ${coordinateType}`, `${capitalised}`],
    withPoint: [
      '',
      `Enter the ${coordinateType} of ${pointName}`,
      `${capitalised} of ${pointName}`
    ]
  }

  const [prefix, enterMsg, typeMsg] = templates[messageType]

  return {
    [JOI_ERRORS.STRING_EMPTY]: prefix ? `${prefix}_REQUIRED` : enterMsg,
    [JOI_ERRORS.ANY_REQUIRED]: prefix ? `${prefix}_REQUIRED` : enterMsg,
    [JOI_ERRORS.STRING_PATTERN_BASE]: prefix
      ? `${prefix}_NON_NUMERIC`
      : `${typeMsg} must be a number`,
    [JOI_ERRORS.NUMBER_BASE]: prefix
      ? `${prefix}_NON_NUMERIC`
      : `${typeMsg} must be a number`,
    [JOI_ERRORS.NUMBER_POSITIVE]: prefix
      ? `${prefix}_POSITIVE_NUMBER`
      : `${typeMsg} must be a positive ${positiveDescription}, like ${example}`,
    [JOI_ERRORS.NUMBER_RANGE]: prefix
      ? `${prefix}_LENGTH`
      : `${typeMsg} must be ${lengthDescription}`
  }
}

export const createOsgb36CoordinateSchema = (
  coordinateType,
  messageType = 'simple',
  pointName = null
) => {
  return joi
    .string()
    .trim()
    .required()
    .custom((value, helpers) =>
      validateCoordinatesWithPattern(value, helpers, coordinateType)
    )
    .messages(createMessages(coordinateType, messageType, pointName))
}

export const osgb36ValidationSchema = joi.object({
  eastings: createOsgb36CoordinateSchema('eastings', 'constants'),
  northings: createOsgb36CoordinateSchema('northings', 'constants')
})

export const osgb36MultipleCoordinateItemSchema = joi.object({
  eastings: createOsgb36CoordinateSchema('eastings', 'simple'),
  northings: createOsgb36CoordinateSchema('northings', 'simple')
})

export const createOsgb36MultipleCoordinatesSchema = () => {
  return joi
    .object({
      coordinates: joi
        .array()
        .min(POLYGON_MIN_COORDINATE_POINTS)
        .items(osgb36MultipleCoordinateItemSchema)
        .required()
        .messages({
          'array.min': `You must provide at least ${POLYGON_MIN_COORDINATE_POINTS} coordinate points`,
          'any.required': 'Coordinates are required'
        })
    })
    .unknown(true)
}
