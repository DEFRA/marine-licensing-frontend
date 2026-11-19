import joi from 'joi'
import { withCharacterLimit } from '#src/server/common/validation/character-limit.js'
import { COMMERCIAL_CONFIDENTIALITY_REASON_MAX_LENGTH } from '#src/server/common/validation/marine-licence-public-register-commercial-confidentiality/constants.js'

export const marineLicencePublicRegisterCommercialConfidentialitySchema =
  joi.object({
    reason: withCharacterLimit(
      joi.string().trim(),
      COMMERCIAL_CONFIDENTIALITY_REASON_MAX_LENGTH
    )
      .required()
      .messages({
        'string.empty':
          'PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_REASON_REQUIRED',
        'any.required':
          'PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_REASON_REQUIRED',
        'string.max':
          'PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_REASON_MAX_LENGTH'
      })
  })
