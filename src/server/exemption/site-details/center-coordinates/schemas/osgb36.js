import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'
import joi from 'joi'

const MIN_EASTINGS_LENGTH = 100000
const MAX_EASTINGS_LENGTH = 999999
const MIN_NORTHINGS_LENGTH = 100000
const MAX_NORTHINGS_LENGTH = 9999999

const validateCoordinates = (value, helpers, type) => {
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

export const osgb36ValidationSchema = joi.object({
  eastings: joi
    .string()
    .required()
    .pattern(/^-?[0-9.]+$/)
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
    .pattern(/^-?[0-9.]+$/)
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
