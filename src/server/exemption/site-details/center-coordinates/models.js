import joi from 'joi'

export const wgs64ValidationSchema = joi.object({
  latitude: joi.string().required().messages({
    'string.empty': 'LATITUDE_REQUIRED',
    'any.required': 'LATITUDE_REQUIRED'
  }),
  longitude: joi.string().required().messages({
    'string.empty': 'LONGITUDE_REQUIRED',
    'any.required': 'LONGITUDE_REQUIRED'
  })
})

export const osgb36ValidationSchema = joi.object({
  eastings: joi.string().required().messages({
    'string.empty': 'EASTINGS_REQUIRED',
    'any.required': 'EASTINGS_REQUIRED'
  }),
  northings: joi.string().required().messages({
    'string.empty': 'NORTHINGS_REQUIRED',
    'any.required': 'NORTHINGS_REQUIRED'
  })
})
