import joi from 'joi'
import { WORKING_HOURS_MAX_LENGTH } from '#src/server/common/validation/working-hours/constants.js'

export const workingHoursSchema = joi.object({
  workingHours: joi
    .string()
    .trim()
    .min(1)
    .max(WORKING_HOURS_MAX_LENGTH)
    .required()
    .messages({
      'string.empty': 'WORKING_HOURS_REQUIRED',
      'any.required': 'WORKING_HOURS_REQUIRED',
      'string.max': 'WORKING_HOURS_MAX_LENGTH'
    })
})
