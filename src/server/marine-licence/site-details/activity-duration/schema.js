import joi from 'joi'

export const activityDurationSchema = joi.object({
  'activity-duration-years': joi.string().required().messages({
    'string.empty': 'DURATION_REQUIRED',
    'any.required': 'DURATION_REQUIRED'
  }),
  'activity-duration-months': joi.when('activity-duration-years', {
    is: joi.string().min(1).required(),
    then: joi.string().required().messages({
      'string.empty': 'DURATION_REQUIRED',
      'any.required': 'DURATION_REQUIRED'
    }),
    otherwise: joi.optional().allow('', null)
  })
})
