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
    .number()
    .required()
    .integer()
    .positive()
    .min(100000)
    .max(999999)
    .messages({
      'number.base': 'EASTINGS_REQUIRED',
      'any.required': 'EASTINGS_REQUIRED',
      'number.min': 'EASTINGS_LENGTH',
      'number.max': 'EASTINGS_LENGTH',
      'number.integer': 'EASTINGS_LENGTH',
      'number.positive': 'EASTINGS_POSITIVE_NUMBER'
    }),
  northings: joi
    .number()
    .required()
    .integer()
    .positive()
    .min(100000)
    .max(9999999)
    .messages({
      'number.base': 'NORTHINGS_REQUIRED',
      'any.required': 'NORTHINGS_REQUIRED',
      'number.min': 'NORTHINGS_LENGTH',
      'number.max': 'NORTHINGS_LENGTH',
      'number.integer': 'NORTHINGS_LENGTH',
      'number.positive': 'NORTHINGS_POSITIVE_NUMBER'
    })
})
