import joi from 'joi'
import { withCharacterLimit } from '#src/server/common/validation/character-limit.js'
import { NATIONAL_SECURITY_REASON_MAX_LENGTH } from '#src/server/common/validation/marine-licence-public-register-national-security/constants.js'

export const marineLicencePublicRegisterNationalSecuritySchema = joi.object({
  nationalSecurityApproval: joi
    .string()
    .valid('yes', 'no')
    .required()
    .messages({
      'any.only': 'PUBLIC_REGISTER_NATIONAL_SECURITY_APPROVAL_REQUIRED',
      'string.empty': 'PUBLIC_REGISTER_NATIONAL_SECURITY_APPROVAL_REQUIRED',
      'any.required': 'PUBLIC_REGISTER_NATIONAL_SECURITY_APPROVAL_REQUIRED'
    }),
  reason: joi.when('nationalSecurityApproval', {
    is: 'yes',
    then: withCharacterLimit(
      joi.string().trim(),
      NATIONAL_SECURITY_REASON_MAX_LENGTH
    )
      .required()
      .messages({
        'string.empty': 'PUBLIC_REGISTER_NATIONAL_SECURITY_REASON_REQUIRED',
        'any.required': 'PUBLIC_REGISTER_NATIONAL_SECURITY_REASON_REQUIRED',
        'string.max': 'PUBLIC_REGISTER_NATIONAL_SECURITY_REASON_MAX_LENGTH'
      }),
    otherwise: joi.any().strip()
  })
})
