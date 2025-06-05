import joi from 'joi'

const individualDate = ({ prefix, filedName }) => {
  return joi.object({
    [`${prefix}-day`]: joi
      .string()
      .pattern(/^\d{1,2}$/)
      .required()
      .messages({
        'string.empty': `The ${filedName} date must include a day`,
        'string.pattern.base': `The ${filedName} day must be a number between 1 and 31`
      }),
    [`${prefix}-month`]: joi
      .string()
      .pattern(/^\d{1,2}$/)
      .required()
      .messages({
        'string.empty': `The ${filedName} date must include a month`,
        'string.pattern.base': `The ${filedName} month must be a number between 1 and 12`
      }),
    [`${prefix}-year`]: joi
      .string()
      .pattern(/^\d{4}$/)
      .required()
      .messages({
        'string.empty': `The ${filedName} date must include a year`,
        'string.pattern.base': `The ${filedName} year must be 4 digits`
      })
  })
}

export const schema = joi
  .object({
    'activity-start-date-day': joi.string().allow('').optional(),
    'activity-start-date-month': joi.string().allow('').optional(),
    'activity-start-date-year': joi.string().allow('').optional(),

    'activity-end-date-day': joi.string().allow('').optional(),
    'activity-end-date-month': joi.string().allow('').optional(),
    'activity-end-date-year': joi.string().allow('').optional()
  })
  .custom((value, helpers) => {
    const {
      'activity-start-date-day': startDay,
      'activity-start-date-month': startMonth,
      'activity-start-date-year': startYear,
      'activity-end-date-day': endDay,
      'activity-end-date-month': endMonth,
      'activity-end-date-year': endYear
    } = value

    if (!startDay && !startMonth && !startYear) {
      return helpers.message('Enter the start date')
    }

    if (!endDay && !endMonth && !endYear) {
      return helpers.message('Enter the end date')
    }

    const startFields = {
      'activity-start-date-day': startDay,
      'activity-start-date-month': startMonth,
      'activity-start-date-year': startYear
    }

    const endFields = {
      'activity-end-date-day': endDay,
      'activity-end-date-month': endMonth,
      'activity-end-date-year': endYear
    }

    const { error: startError } = individualDate({
      prefix: 'activity-start-date',
      filedName: 'start'
    }).validate(startFields, {
      abortEarly: false
    })

    const { error: endError } = individualDate({
      prefix: 'activity-end-date',
      filedName: 'end'
    }).validate(endFields, {
      abortEarly: false
    })

    const errors = []

    if (startError) errors.push(...startError.details)
    if (endError) errors.push(...endError.details)

    if (errors.length === 0) {
      const startDate = new Date(`${startYear}-${startMonth}-${startDay}`)
      const endDate = new Date(`${endYear}-${endMonth}-${endDay}`)

      if (startDate <= Date.now()) {
        errors.push({
          message: 'The start date must be today or in the future'
        })
      }

      if (startDate > endDate) {
        errors.push({
          message: 'The end date must be the same as or after the start date'
        })
      }
    }

    if (errors.length > 0) {
      return helpers.error('any.custom', {
        message: errors.map((e) => e.message),
        details: errors.map((e) => e.message)
      })
    }

    return value
  })
  .messages({
    'any.custom': '{{#message}}'
  })
