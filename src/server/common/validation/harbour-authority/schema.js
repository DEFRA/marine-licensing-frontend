import joi from 'joi'

export const harbourAuthoritySchema = joi.object({
  area: joi.string().valid('yes', 'no').required().messages({
    'any.only': 'HARBOUR_AUTHORITY_REQUIRED',
    'string.empty': 'HARBOUR_AUTHORITY_REQUIRED',
    'any.required': 'HARBOUR_AUTHORITY_REQUIRED'
  }),
  details: joi.when('area', {
    is: 'yes',
    then: joi.string().trim().max(1000).required().messages({
      'string.empty': 'HARBOUR_AUTHORITY_AREA_REQUIRED',
      'any.required': 'HARBOUR_AUTHORITY_AREA_REQUIRED',
      'string.max': 'HARBOUR_AUTHORITY_AREA_MAX_LENGTH'
    })
  })
})
