import joi from 'joi'
import { MONTHS_OF_ACTIVITY_DETAILS_MAX_LENGTH } from '#src/server/marine-licence/site-details/months-of-activity/constants.js'

export const monthsOfActivitySchema = joi.object({
  months: joi.string().valid('yes', 'no').required().messages({
    'any.only': 'MONTHS_OF_ACTIVITY_REQUIRED',
    'string.empty': 'MONTHS_OF_ACTIVITY_REQUIRED',
    'any.required': 'MONTHS_OF_ACTIVITY_REQUIRED'
  }),
  details: joi.when('months', {
    is: 'yes',
    then: joi
      .string()
      .trim()
      .max(MONTHS_OF_ACTIVITY_DETAILS_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'MONTHS_OF_ACTIVITY_DETAILS_REQUIRED',
        'any.required': 'MONTHS_OF_ACTIVITY_DETAILS_REQUIRED',
        'string.max': 'MONTHS_OF_ACTIVITY_DETAILS_MAX_LENGTH'
      })
  })
})
