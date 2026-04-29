import joi from 'joi'
import { COMPLETION_DATE_REASON_MAX_LENGTH } from '#src/server/marine-licence/site-details/completion-date/constants.js'

export const completionDateSchema = joi.object({
  date: joi.string().valid('yes', 'no').required().messages({
    'any.only': 'COMPLETION_DATE_REQUIRED',
    'string.empty': 'COMPLETION_DATE_REQUIRED',
    'any.required': 'COMPLETION_DATE_REQUIRED'
  }),
  reason: joi.when('date', {
    is: 'yes',
    then: joi
      .string()
      .trim()
      .max(COMPLETION_DATE_REASON_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'COMPLETION_DATE_REASON_REQUIRED',
        'any.required': 'COMPLETION_DATE_REASON_REQUIRED',
        'string.max': 'COMPLETION_DATE_REASON_MAX_LENGTH'
      })
  })
})
