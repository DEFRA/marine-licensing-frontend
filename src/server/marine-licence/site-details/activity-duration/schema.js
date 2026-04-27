import joi from 'joi'

const MAX_MONTHS = 11

const yearsSchema = joi.number().integer().min(0).empty('').messages({
  'number.base': 'YEARS_NOT_INTEGER',
  'number.integer': 'YEARS_NOT_INTEGER',
  'number.min': 'YEARS_NOT_INTEGER'
})

const monthsSchema = joi
  .number()
  .integer()
  .min(0)
  .max(MAX_MONTHS)
  .empty('')
  .messages({
    'number.base': 'MONTHS_NOT_VALID',
    'number.integer': 'MONTHS_NOT_VALID',
    'number.min': 'MONTHS_NOT_VALID',
    'number.max': 'MONTHS_NOT_VALID'
  })

export const activityDurationSchema = joi.object({
  'activity-duration-years': yearsSchema.required().messages({
    'any.required': 'YEARS_REQUIRED'
  }),
  'activity-duration-months': monthsSchema
    .required()
    .messages({
      'any.required': 'MONTHS_REQUIRED'
    })
    .when('activity-duration-years', {
      is: 0,
      then: monthsSchema.invalid(0).messages({
        'any.invalid': 'DURATION_BOTH_ZERO'
      })
    })
})
