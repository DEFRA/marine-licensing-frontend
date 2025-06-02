import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'
import joi from 'joi'

const MIN_LATITUDE = -90
const MAX_LATITUDE = 90
const MIN_LONGITUDE = -180
const MAX_LONGITUDE = 180
const LAT_LONG_DECIMAL_PLACES = 6

const MIN_EASTINGS_LENGTH = 100000
const MAX_EASTINGS_LENGTH = 999999
const MIN_NORTHINGS_LENGTH = 100000
const MAX_NORTHINGS_LENGTH = 9999999

const validateDecimals = (value, helpers) => {
  const decimalParts = value.split('.')
  if (
    decimalParts.length !== 2 ||
    decimalParts[1].length !== LAT_LONG_DECIMAL_PLACES
  ) {
    return helpers.error(JOI_ERRORS.NUMBER_DECIMAL)
  }

  return null
}

export const wgs64ValidationSchema = joi.object({
  latitude: joi
    .string()
    .required()
    .pattern(/^-?[0-9.]+$/)
    .custom((value, helpers) => {
      const latitude = Number(value)
      if (isNaN(latitude)) {
        return helpers.error(JOI_ERRORS.NUMBER_BASE)
      }

      if (latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
        return helpers.error(JOI_ERRORS.NUMBER_RANGE)
      }

      const decimals = validateDecimals(value, helpers)
      if (decimals) {
        return decimals
      }

      return value
    })
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
    .custom((value, helpers) => {
      const longitude = Number(value)
      if (isNaN(longitude)) {
        return helpers.error(JOI_ERRORS.NUMBER_BASE)
      }

      if (longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
        return helpers.error(JOI_ERRORS.NUMBER_RANGE)
      }

      const decimals = validateDecimals(value, helpers)
      if (decimals) {
        return decimals
      }

      return value
    })
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'LONGITUDE_REQUIRED',
      [JOI_ERRORS.ANY_REQUIRED]: 'LONGITUDE_REQUIRED',
      [JOI_ERRORS.STRING_PATTERN_BASE]: 'LONGITUDE_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_BASE]: 'LONGITUDE_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_RANGE]: 'LONGITUDE_LENGTH',
      [JOI_ERRORS.NUMBER_DECIMAL]: 'LONGITUDE_DECIMAL_PLACES'
    })
})

export const osgb36ValidationSchema = joi.object({
  eastings: joi
    .string()
    .required()
    .pattern(/^-?[0-9.]+$/)
    .custom((value, helpers) => {
      const eastings = Number(value)
      if (isNaN(eastings)) {
        return helpers.error(JOI_ERRORS.NUMBER_BASE)
      }
      if (eastings <= 0) {
        return helpers.error(JOI_ERRORS.NUMBER_POSITIVE)
      }
      if (eastings < MIN_EASTINGS_LENGTH || eastings > MAX_EASTINGS_LENGTH) {
        return helpers.error(JOI_ERRORS.NUMBER_RANGE)
      }
      return value
    })
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
    .custom((value, helpers) => {
      const northings = Number(value)
      if (isNaN(northings)) {
        return helpers.error(JOI_ERRORS.NUMBER_BASE)
      }
      if (northings <= 0) {
        return helpers.error(JOI_ERRORS.NUMBER_POSITIVE)
      }
      if (
        northings < MIN_NORTHINGS_LENGTH ||
        northings > MAX_NORTHINGS_LENGTH
      ) {
        return helpers.error(JOI_ERRORS.NUMBER_RANGE)
      }
      return value
    })
    .messages({
      [JOI_ERRORS.STRING_EMPTY]: 'NORTHINGS_REQUIRED',
      [JOI_ERRORS.STRING_PATTERN_BASE]: 'NORTHINGS_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_BASE]: 'NORTHINGS_NON_NUMERIC',
      [JOI_ERRORS.NUMBER_POSITIVE]: 'NORTHINGS_POSITIVE_NUMBER',
      [JOI_ERRORS.NUMBER_RANGE]: 'NORTHINGS_LENGTH',
      [JOI_ERRORS.ANY_REQUIRED]: 'NORTHINGS_REQUIRED'
    })
})
