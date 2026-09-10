import joi from 'joi'

// consent 'yes' means the applicant is happy for information to be published.
// The marine licence journey's schema uses the same field with the opposite meaning.
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
