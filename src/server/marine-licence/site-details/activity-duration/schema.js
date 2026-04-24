import joi from 'joi'

export const durationSchema = joi.object({
  'duration-years': joi.string().required().messages({
    'string.empty': 'DURATION_REQUIRED',
    'any.required': 'DURATION_REQUIRED'
  }),
  'duration-months': joi.when('duration-years', {
    is: joi.string().min(1).required(),
    then: joi.string().required().messages({
      'string.empty': 'DURATION_REQUIRED',
      'any.required': 'DURATION_REQUIRED'
    }),
    otherwise: joi.optional().allow('', null)
  })
})
