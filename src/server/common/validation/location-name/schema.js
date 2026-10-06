import joi from 'joi'
import { LOCATION_NAME_MAX_LENGTH } from '#src/server/common/validation/location-name/constants.js'

export const locationNameSchema = joi.object({
  locationName: joi
    .string()
    .min(1)
    .max(LOCATION_NAME_MAX_LENGTH)
    .required()
    .messages({
      'string.empty': 'LOCATION_NAME_REQUIRED',
      'any.required': 'LOCATION_NAME_REQUIRED',
      'string.max': 'LOCATION_NAME_MAX_LENGTH'
    })
})
