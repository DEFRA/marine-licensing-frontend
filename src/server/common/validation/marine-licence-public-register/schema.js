import joi from 'joi'

// consent 'yes' means the applicant wants information withheld. The exemption
// journey's schema uses the same field with the opposite meaning.
export const marineLicencePublicRegisterSchema = joi.object({
  consent: joi.string().valid('yes', 'no').required().messages({
    'any.only': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
    'string.empty': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
    'any.required': 'PUBLIC_REGISTER_CONSENT_REQUIRED'
  }),
  reason: joi.when('consent', {
    is: 'yes',
    then: joi.string().trim().max(1000).required().messages({
      'string.empty': 'PUBLIC_REGISTER_REASON_REQUIRED',
      'any.required': 'PUBLIC_REGISTER_REASON_REQUIRED',
      'string.max': 'PUBLIC_REGISTER_REASON_MAX_LENGTH'
    })
  })
})
