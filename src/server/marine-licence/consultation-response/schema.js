import joi from 'joi'

export const consultationResponseSchema = joi.object({
  consultationResponse: joi.string().trim().max(1000).required().messages({
    'string.empty': 'CONSULTATION_RESPONSE_REQUIRED',
    'any.required': 'CONSULTATION_RESPONSE_REQUIRED',
    'string.max': 'CONSULTATION_RESPONSE_MAX_LENGTH'
  })
})
