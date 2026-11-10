import joi from 'joi'
import { WITHHOLD_REASON } from '#src/server/common/validation/marine-licence-public-register/constants.js'

export const marineLicencePublicRegisterSchema = joi.object({
  withholdConsent: joi.string().valid('yes', 'no').required().messages({
    'any.only': 'PUBLIC_REGISTER_WITHHOLD_CONSENT_REQUIRED',
    'string.empty': 'PUBLIC_REGISTER_WITHHOLD_CONSENT_REQUIRED',
    'any.required': 'PUBLIC_REGISTER_WITHHOLD_CONSENT_REQUIRED'
  }),
  withholdReason: joi.when('withholdConsent', {
    is: 'yes',
    then: joi
      .string()
      .valid(...Object.values(WITHHOLD_REASON))
      .required()
      .messages({
        'any.only': 'PUBLIC_REGISTER_WITHHOLD_REASON_REQUIRED',
        'string.empty': 'PUBLIC_REGISTER_WITHHOLD_REASON_REQUIRED',
        'any.required': 'PUBLIC_REGISTER_WITHHOLD_REASON_REQUIRED'
      }),
    otherwise: joi.any().strip()
  })
})
