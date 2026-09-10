import joi from 'joi'

export const marineLicencePublicRegisterSchema = joi.object({
  withholdRequest: joi.string().valid('yes', 'no').required().messages({
    'any.only': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
    'string.empty': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
    'any.required': 'PUBLIC_REGISTER_CONSENT_REQUIRED'
  }),
  withholdDetails: joi.when('withholdRequest', {
    is: 'yes',
    then: joi.string().trim().max(1000).required().messages({
      'string.empty': 'PUBLIC_REGISTER_REASON_REQUIRED',
      'any.required': 'PUBLIC_REGISTER_REASON_REQUIRED',
      'string.max': 'PUBLIC_REGISTER_REASON_MAX_LENGTH'
    })
  })
})
