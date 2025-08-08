import joi from 'joi'
import {
  POLYGON_MIN_COORDINATE_POINTS,
  WGS84_CONSTANTS
} from '~/src/server/common/constants/exemptions.js'
import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'

const {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
  DECIMAL_PLACES: LAT_LONG_DECIMAL_PLACES
} = WGS84_CONSTANTS

const isLatitudeInRange = (coordinate) =>
  coordinate >= MIN_LATITUDE && coordinate <= MAX_LATITUDE

const isLongitudeInRange = (coordinate) =>
  coordinate >= MIN_LONGITUDE && coordinate <= MAX_LONGITUDE

const capitaliseCoordinateType = (coordinateType) =>
  coordinateType.charAt(0).toUpperCase() + coordinateType.slice(1)

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
  if (type === 'latitude' && !isLatitudeInRange(coordinate)) {
    return helpers.error(JOI_ERRORS.NUMBER_RANGE)
  }

  if (type === 'longitude' && !isLongitudeInRange(coordinate)) {
    return helpers.error(JOI_ERRORS.NUMBER_RANGE)
  }

  return value
}

const validateCoordinatesWithPattern = (value, helpers, type) => {
  const numericPattern = /^-?\d+(\.\d+)?$/
  if (!numericPattern.test(value)) {
    return helpers.error(JOI_ERRORS.STRING_PATTERN_BASE)
  }

  const coordinateValidation = validateCoordinates(value, helpers, type)
  if (coordinateValidation !== value) {
    return coordinateValidation
  }

  return validateDecimals(value, helpers)
}

const COORDINATE_CONFIG = {
  latitude: {
    constantPrefix: 'LATITUDE',
    range: 'between -90 and 90',
    example: '55.019889'
  },
  longitude: {
    constantPrefix: 'LONGITUDE',
    range: 'between -180 and 180',
    example: '-1.399500'
  }
}

const createMessages = (coordinateType, messageType, pointName) => {
  const { constantPrefix, range, example } = COORDINATE_CONFIG[coordinateType]
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
    [JOI_ERRORS.NUMBER_RANGE]: prefix
      ? `${prefix}_LENGTH`
      : `${typeMsg} must be ${range}`,
    [JOI_ERRORS.NUMBER_DECIMAL]: prefix
      ? `${prefix}_DECIMAL_PLACES`
      : `${typeMsg} must include 6 decimal places, like ${example}`
  }
}

export const createCoordinateSchema = (
  coordinateType,
  messageType = 'simple',
  pointName = null
) => {
  return joi
    .string()
    .required()
    .custom((value, helpers) =>
      validateCoordinatesWithPattern(value, helpers, coordinateType)
    )
    .messages(createMessages(coordinateType, messageType, pointName))
}

export const wgs84ValidationSchema = joi.object({
  latitude: createCoordinateSchema('latitude', 'constants'),
  longitude: createCoordinateSchema('longitude', 'constants')
})

export const wgs84MultipleCoordinateItemSchema = joi.object({
  latitude: createCoordinateSchema('latitude', 'simple'),
  longitude: createCoordinateSchema('longitude', 'simple')
})

export const createWgs84MultipleCoordinatesSchema = () => {
  return joi
    .object({
      coordinates: joi
        .array()
        .min(POLYGON_MIN_COORDINATE_POINTS)
        .items(wgs84MultipleCoordinateItemSchema)
        .required()
        .messages({
          'array.min': `You must provide at least ${POLYGON_MIN_COORDINATE_POINTS} coordinate points`,
          'any.required': 'Coordinates are required'
        })
    })
    .unknown(true)
}
