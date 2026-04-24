import joi from 'joi'
import { ACTIVITY_DESCRIPTION_MAX_LENGTH } from '#src/server/common/validation/activity-description/constants.js'

export const activityDescriptionSchema = joi.object({
  activityDescription: joi
    .string()
    .min(1)
    .max(ACTIVITY_DESCRIPTION_MAX_LENGTH)
    .required()
    .messages({
      'string.empty': 'ACTIVITY_DESCRIPTION_REQUIRED',
      'any.required': 'ACTIVITY_DESCRIPTION_REQUIRED',
      'string.max': 'ACTIVITY_DESCRIPTION_MAX_LENGTH'
    })
})
