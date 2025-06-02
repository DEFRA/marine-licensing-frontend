import joi from 'joi'

export const wgs64ValidationSchema = joi.object({
  latitude: joi
    .string()
    .required()
    .pattern(/^-?[0-9.]+$/)
    .custom((value, helpers) => {
      if (value === '') {
        return helpers.error('string.empty')
      }

      const latitude = Number(value)
      if (isNaN(latitude)) {
        return helpers.error('number.base')
      }

      if (latitude < -90 || latitude > 90) {
        return helpers.error('number.range')
      }

      const decimalParts = value.split('.')
      if (decimalParts.length !== 2 || decimalParts[1].length !== 6) {
        return helpers.error('number.decimal')
      }

      return latitude
    })
    .messages({
      'string.empty': 'LATITUDE_REQUIRED',
      'any.required': 'LATITUDE_REQUIRED',
      'string.pattern.base': 'LATITUDE_NON_NUMERIC',
      'number.base': 'LATITUDE_NON_NUMERIC',
      'number.range': 'LATITUDE_LENGTH',
      'number.decimal': 'LATITUDE_DECIMAL_PLACES'
    }),
  longitude: joi
    .string()
    .required()
    .pattern(/^-?[0-9.]+$/)
    .custom((value, helpers) => {
      if (value === '') {
        return helpers.error('string.empty')
      }

      const longitude = Number(value)
      if (isNaN(longitude)) {
        return helpers.error('number.base')
      }

      if (longitude < -180 || longitude > 180) {
        return helpers.error('number.range')
      }

      const decimalParts = value.split('.')
      if (decimalParts.length !== 2 || decimalParts[1].length !== 6) {
        return helpers.error('number.decimal')
      }

      return longitude
    })
    .messages({
      'string.empty': 'LONGITUDE_REQUIRED',
      'any.required': 'LONGITUDE_REQUIRED',
      'string.pattern.base': 'LONGITUDE_NON_NUMERIC',
      'number.base': 'LONGITUDE_NON_NUMERIC',
      'number.range': 'LONGITUDE_LENGTH',
      'number.decimal': 'LONGITUDE_DECIMAL_PLACES'
    })
})

export const osgb36ValidationSchema = joi.object({
  eastings: joi
    .string()
    .required()
    .pattern(/^-?[0-9.]+$/)
    .custom((value, helpers) => {
      if (value === '') {
        return helpers.error('string.empty')
      }
      const eastings = Number(value)
      if (isNaN(eastings)) {
        return helpers.error('number.base')
      }
      if (eastings <= 0) {
        return helpers.error('number.positive')
      }
      if (eastings < 100000 || eastings > 999999) {
        return helpers.error('number.range')
      }
      return eastings
    })
    .messages({
      'string.empty': 'EASTINGS_REQUIRED',
      'string.pattern.base': 'EASTINGS_NON_NUMERIC',
      'number.base': 'EASTINGS_NON_NUMERIC',
      'number.positive': 'EASTINGS_POSITIVE_NUMBER',
      'number.range': 'EASTINGS_LENGTH',
      'any.required': 'EASTINGS_REQUIRED'
    }),
  northings: joi
    .string()
    .required()
    .pattern(/^-?[0-9.]+$/)
    .custom((value, helpers) => {
      if (value === '') {
        return helpers.error('string.empty')
      }
      const northings = Number(value)
      if (isNaN(northings)) {
        return helpers.error('number.base')
      }
      if (northings <= 0) {
        return helpers.error('number.positive')
      }
      if (northings < 100000 || northings > 9999999) {
        return helpers.error('number.range')
      }
      return northings
    })
    .messages({
      'string.empty': 'NORTHINGS_REQUIRED',
      'string.pattern.base': 'NORTHINGS_NON_NUMERIC',
      'number.base': 'NORTHINGS_NON_NUMERIC',
      'number.positive': 'NORTHINGS_POSITIVE_NUMBER',
      'number.range': 'NORTHINGS_LENGTH',
      'any.required': 'NORTHINGS_REQUIRED'
    })
})
