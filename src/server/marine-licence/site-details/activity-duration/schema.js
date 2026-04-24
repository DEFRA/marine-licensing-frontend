import joi from 'joi'

const validateMonthRange = (value, helpers) => {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 11) {
    return helpers.error('any.custom')
  }
  return value
}

export const activityDurationSchema = joi.object({
  'activity-duration-years': joi.string().required().pattern(/^\d+$/).messages({
    'string.empty': 'DURATION_REQUIRED',
    'any.required': 'DURATION_REQUIRED',
    'string.pattern.base': 'YEARS_NOT_INTEGER'
  }),
  'activity-duration-months': joi.when('activity-duration-years', {
    is: joi.string().min(1).required(),
    then: joi.when('activity-duration-years', {
      is: joi.valid('0'),
      then: joi
        .string()
        .invalid('0')
        .required()
        .custom(validateMonthRange)
        .messages({
          'any.invalid': 'DURATION_BOTH_ZERO',
          'string.empty': 'DURATION_REQUIRED',
          'any.required': 'DURATION_REQUIRED',
          'any.custom': 'MONTHS_NOT_VALID'
        }),
      otherwise: joi.string().required().custom(validateMonthRange).messages({
        'string.empty': 'DURATION_REQUIRED',
        'any.required': 'DURATION_REQUIRED',
        'any.custom': 'MONTHS_NOT_VALID'
      })
    }),
    otherwise: joi.optional().allow('', null)
  })
})
