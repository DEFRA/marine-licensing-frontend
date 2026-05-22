import joi from 'joi'

export const publicConsultationSchema = joi.object({
  consulted: joi.string().valid('yes', 'no').required().messages({
    'any.only': 'PUBLIC_CONSULTATION_REQUIRED',
    'string.empty': 'PUBLIC_CONSULTATION_REQUIRED',
    'any.required': 'PUBLIC_CONSULTATION_REQUIRED'
  }),
  details: joi.when('consulted', {
    is: 'yes',
    then: joi.string().trim().max(1000).required().messages({
      'string.empty': 'PUBLIC_CONSULTATION_DETAILS_REQUIRED',
      'any.required': 'PUBLIC_CONSULTATION_DETAILS_REQUIRED',
      'string.max': 'PUBLIC_CONSULTATION_DETAILS_MAX_LENGTH'
    })
  })
})
