import joi from 'joi'

export const publicRegisterSchema = joi.object({
  consent: joi.string().valid('yes', 'no').required().messages({
    'any.only': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
    'string.empty': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
    'any.required': 'PUBLIC_REGISTER_CONSENT_REQUIRED'
  }),
  reason: joi.when('consent', {
    is: 'no',
    then: joi.string().trim().max(1000).required().messages({
      'string.empty': 'PUBLIC_REGISTER_REASON_REQUIRED',
      'any.required': 'PUBLIC_REGISTER_REASON_REQUIRED',
      'string.max': 'PUBLIC_REGISTER_REASON_MAX_LENGTH'
    })
  })
})
