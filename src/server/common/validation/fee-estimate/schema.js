import joi from 'joi'
import { feeEstimateErrorMessages } from '#src/server/common/validation/fee-estimate/constants.js'

export const feeEstimateSchema = joi.object({
  termsAndConditions: joi.valid('true').required().messages({
    'any.only':
      feeEstimateErrorMessages.FEE_ESTIMATE_TERMS_AND_CONDITIONS_REQUIRED,
    'any.required':
      feeEstimateErrorMessages.FEE_ESTIMATE_TERMS_AND_CONDITIONS_REQUIRED
  }),
  accept: joi.string().valid('yes', 'no').required().messages({
    'string.empty': feeEstimateErrorMessages.FEE_ESTIMATE_ACCEPT_REQUIRED,
    'any.required': feeEstimateErrorMessages.FEE_ESTIMATE_ACCEPT_REQUIRED,
    'any.only': feeEstimateErrorMessages.FEE_ESTIMATE_ACCEPT_REQUIRED
  }),
  feeBand: joi.string().valid('2A').required()
})
