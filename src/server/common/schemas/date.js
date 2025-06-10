import joi from 'joi'

const MIN_YEAR = new Date().getFullYear()
const MAX_YEAR_OFFSET = 75
const MAX_YEAR = MIN_YEAR + MAX_YEAR_OFFSET

const MAX_DAYS_IN_MONTH = 31
const MAX_MONTHS_IN_YEAR = 12

export const individualDate = ({
  prefix,
  minYear = MIN_YEAR,
  maxYear = MAX_YEAR
}) => ({
  [`${prefix}-day`]: joi
    .number()
    .integer()
    .min(1)
    .max(MAX_DAYS_IN_MONTH)
    .required()
    .messages({
      'any.required': `${prefix}-day`,
      'number.base': `${prefix}-day`
    }),
  [`${prefix}-month`]: joi
    .number()
    .integer()
    .min(1)
    .max(MAX_MONTHS_IN_YEAR)
    .required()
    .messages({
      'any.required': `${prefix}-month`,
      'number.base': `${prefix}-month`
    }),
  [`${prefix}-year`]: joi
    .number()
    .integer()
    .min(minYear)
    .max(maxYear)
    .required()
    .messages({
      'any.required': `${prefix}-year`,
      'number.base': `${prefix}-year`
    })
})

const isValidDate = ({ date, day, month, year }) =>
  date.getUTCFullYear() === year &&
  date.getUTCMonth() === month - 1 &&
  date.getUTCDate() === day

export const activityStartEndDateSchema = joi
  .object({
    ...individualDate({
      prefix: 'activity-start-date',
      minYear: MIN_YEAR,
      maxYear: MAX_YEAR
    }),
    ...individualDate({
      prefix: 'activity-end-date',
      minYear: MIN_YEAR,
      maxYear: MAX_YEAR
    })
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

    const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay))
    const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay))

    if (
      !isValidDate({
        date: startDate,
        day: startDay,
        month: startMonth,
        year: endYear
      })
    ) {
      return helpers.error('custom.startDate.invalid')
    }

    if (
      !isValidDate({
        date: endDate,
        day: endDay,
        month: endMonth,
        year: endYear
      })
    ) {
      return helpers.error('custom.endDate.invalid')
    }

    if (endDate < startDate) {
      return helpers.error('custom.endDate.before.startDate')
    }

    return value
  })
  .messages({
    'custom.startDate.invalid': 'custom.startDate.invalid',
    'custom.endDate.invalid': 'custom.endDate.invalid',
    'custom.endDate.before.startDate': 'custom.endDate.before.startDate'
  })
