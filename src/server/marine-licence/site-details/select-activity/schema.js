import joi from 'joi'

export const selectActivitySchema = joi.object({
  activities: joi
    .array()
    .items(joi.string())
    .single()
    .min(1)
    .required()
    .messages({
      'any.required': 'ACTIVITIES_REQUIRED',
      'array.min': 'ACTIVITIES_REQUIRED'
    }),
  otherActivity: joi.when('activities', {
    is: joi.array().required().has('other'),
    then: joi.string().trim().max(1000).required().messages({
      'string.empty': 'ACTIVITIES_OTHER_REASON_REQUIRED',
      'any.required': 'ACTIVITIES_OTHER_REASON_REQUIRED',
      'string.max': 'ACTIVITIES_OTHER_REASON_MAX_LENGTH'
    })
  })
})
