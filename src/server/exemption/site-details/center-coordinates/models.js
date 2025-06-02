import joi from 'joi'

export const wgs64ValidationSchema = joi.object({
  latitude: joi.number().required().min(-90).max(90).messages({
    'number.base': 'LATITUDE_REQUIRED',
    'any.required': 'LATITUDE_REQUIRED',
    'number.min': 'LATITUDE_LENGTH',
    'number.max': 'LATITUDE_LENGTH'
  }),
  longitude: joi.number().min(-90).max(90).required().messages({
    'number.base': 'LONGITUDE_REQUIRED',
    'any.required': 'LONGITUDE_REQUIRED',
    'number.min': 'LONGITUDE_LENGTH',
    'number.max': 'LONGITUDE_LENGTH'
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
