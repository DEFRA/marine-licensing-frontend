import joi from 'joi'
import {
  COORDINATE_SYSTEMS,
  MIN_COORDINATE_POINTS,
  OSGB36_CONSTANTS
} from '~/src/server/common/constants/coordinates.js'
import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'
import {
  COORDINATE_ERROR_MESSAGES,
  createPointSpecificErrorMessages
} from '~/src/server/common/helpers/site-details.js'

const {
  MIN_EASTINGS: MIN_EASTINGS_LENGTH,
  MAX_EASTINGS: MAX_EASTINGS_LENGTH,
  MIN_NORTHINGS: MIN_NORTHINGS_LENGTH,
  MAX_NORTHINGS: MAX_NORTHINGS_LENGTH
} = OSGB36_CONSTANTS

const isEastingsInRange = (coordinate) =>
  coordinate >= MIN_EASTINGS_LENGTH && coordinate <= MAX_EASTINGS_LENGTH

const isNorthingsInRange = (coordinate) =>
  coordinate >= MIN_NORTHINGS_LENGTH && coordinate <= MAX_NORTHINGS_LENGTH

export const validateCoordinates = (value, helpers, type) => {
  const coordinate = Number(value)

  if (isNaN(coordinate)) {
    return helpers.error('number.base')
  }

  if (coordinate <= 0) {
    return helpers.error('number.positive')
  }

  if (type === 'eastings' && !isEastingsInRange(coordinate)) {
    return helpers.error('number.range')
  }

  if (type === 'northings' && !isNorthingsInRange(coordinate)) {
    return helpers.error('number.range')
  }

  return value
}

const createOsgb36CoordinateSchema = (coordinateType, errorMessages) => {
  const messageKey = coordinateType.toUpperCase()

  return joi
    .string()
    .required()
    .pattern(/^-?\d+$/) // Only allow integers
    .custom((value, helpers) =>
      validateCoordinates(value, helpers, coordinateType)
    )
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: errorMessages[`${messageKey}_REQUIRED`],
      [JOI_ERRORS.ANY_REQUIRED]: errorMessages[`${messageKey}_REQUIRED`],
      [JOI_ERRORS.STRING_PATTERN_BASE]:
        errorMessages[`${messageKey}_NON_NUMERIC`],
      [JOI_ERRORS.NUMBER_BASE]: errorMessages[`${messageKey}_NON_NUMERIC`],
      [JOI_ERRORS.NUMBER_POSITIVE]:
        errorMessages[`${messageKey}_POSITIVE_NUMBER`],
      [JOI_ERRORS.NUMBER_RANGE]: errorMessages[`${messageKey}_LENGTH`]
    })
}

const createBaseOsgb36Schema = (
  errorMessages = COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.OSGB36]
) => {
  const pattern = /^-?\d+$/ // Only allow integers

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
        [JOI_ERRORS.STRING_PATTERN_BASE]: errorMessages.EASTINGS_NON_NUMERIC,
        [JOI_ERRORS.NUMBER_BASE]: errorMessages.EASTINGS_NON_NUMERIC,
        [JOI_ERRORS.NUMBER_POSITIVE]: errorMessages.EASTINGS_POSITIVE_NUMBER,
        [JOI_ERRORS.NUMBER_RANGE]: errorMessages.EASTINGS_LENGTH,
        [JOI_ERRORS.ANY_REQUIRED]: errorMessages.EASTINGS_REQUIRED
      }),
    northings: joi
      .string()
      .required()
      .pattern(pattern)
      .custom((value, helpers) =>
        validateCoordinates(value, helpers, 'northings')
      )
      .messages({
        [JOI_ERRORS.STRING_EMPTY]: errorMessages.NORTHINGS_REQUIRED,
        [JOI_ERRORS.STRING_PATTERN_BASE]: errorMessages.NORTHINGS_NON_NUMERIC,
        [JOI_ERRORS.NUMBER_BASE]: errorMessages.NORTHINGS_NON_NUMERIC,
        [JOI_ERRORS.NUMBER_POSITIVE]: errorMessages.NORTHINGS_POSITIVE_NUMBER,
        [JOI_ERRORS.NUMBER_RANGE]: errorMessages.NORTHINGS_LENGTH,
        [JOI_ERRORS.ANY_REQUIRED]: errorMessages.NORTHINGS_REQUIRED
      })
  })
}

export const osgb36ValidationSchema = createBaseOsgb36Schema({
  EASTINGS_REQUIRED: 'EASTINGS_REQUIRED',
  EASTINGS_NON_NUMERIC: 'EASTINGS_NON_NUMERIC',
  EASTINGS_POSITIVE_NUMBER: 'EASTINGS_POSITIVE_NUMBER',
  EASTINGS_LENGTH: 'EASTINGS_LENGTH',
  NORTHINGS_REQUIRED: 'NORTHINGS_REQUIRED',
  NORTHINGS_NON_NUMERIC: 'NORTHINGS_NON_NUMERIC',
  NORTHINGS_POSITIVE_NUMBER: 'NORTHINGS_POSITIVE_NUMBER',
  NORTHINGS_LENGTH: 'NORTHINGS_LENGTH'
})

export const osgb36IntegerValidationSchema = createBaseOsgb36Schema()

export const createOsgb36PointSchema = (pointName) => {
  const pointSpecificMessages = createPointSpecificErrorMessages(
    pointName,
    COORDINATE_SYSTEMS.OSGB36
  )
  return createBaseOsgb36Schema(pointSpecificMessages)
}

export const createEastingsSchema = (pointName) => {
  const pointSpecificMessages = createPointSpecificErrorMessages(
    pointName,
    COORDINATE_SYSTEMS.OSGB36
  )
  return createOsgb36CoordinateSchema('eastings', pointSpecificMessages)
}

export const createNorthingsSchema = (pointName) => {
  const pointSpecificMessages = createPointSpecificErrorMessages(
    pointName,
    COORDINATE_SYSTEMS.OSGB36
  )
  return createOsgb36CoordinateSchema('northings', pointSpecificMessages)
}

export const createOsgb36MultipleCoordinatesSchema = () => {
  return joi
    .object({
      coordinates: joi
        .array()
        .min(MIN_COORDINATE_POINTS)
        .items(osgb36IntegerValidationSchema)
        .required()
        .messages({
          'array.min': `You must provide at least ${MIN_COORDINATE_POINTS} coordinate points`,
          'any.required': 'Coordinates are required'
        })
    })
    .unknown(true)
}
