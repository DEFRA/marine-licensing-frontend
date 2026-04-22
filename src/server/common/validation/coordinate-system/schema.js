import joi from 'joi'

export const coordinateSystemSchema = joi.object({
  coordinateSystem: joi.string().valid('wgs84', 'osgb36').required().messages({
    'any.only': 'COORDINATE_SYSTEM_REQUIRED',
    'string.empty': 'COORDINATE_SYSTEM_REQUIRED',
    'any.required': 'COORDINATE_SYSTEM_REQUIRED'
  })
})
