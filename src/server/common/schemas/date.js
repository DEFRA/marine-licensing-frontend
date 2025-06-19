import joi from 'joi'
import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'

const MIN_YEAR = new Date().getFullYear()
const MAX_YEAR_OFFSET = 75
const MAX_YEAR = MIN_YEAR + MAX_YEAR_OFFSET

const MAX_DAYS_IN_MONTH = 31
const MAX_MONTHS_IN_YEAR = 12

/**
 * Creates individual date field validation schema
 * @param {object} config - Configuration object
 * @param {string} config.prefix - Field prefix (e.g., 'activity-start-date')
 * @param {number} config.minYear - Minimum allowed year (default: current year)
 * @param {number} config.maxYear - Maximum allowed year (default: current year + 75)
 * @param {string} config.minYearError - Error message for minimum year validation
 * @returns {object} Joi schema object for day, month, year fields
 */
export const individualDate = ({
  prefix,
  minYear = MIN_YEAR,
  maxYear = MAX_YEAR,
  minYearError
}) => ({
  [`${prefix}-day`]: joi
    .number()
    .integer()
    .min(1)
    .max(MAX_DAYS_IN_MONTH)
    .required()
    .messages({
      'any.required': `${prefix}-day`,
      'number.base': `${prefix}-day`,
      'number.min': `${prefix}-day`,
      'number.max': `${prefix}-day`
    }),
  [`${prefix}-month`]: joi
    .number()
    .integer()
    .min(1)
    .max(MAX_MONTHS_IN_YEAR)
    .required()
    .messages({
      'any.required': `${prefix}-month`,
      'number.base': `${prefix}-month`,
      'number.min': `${prefix}-month`,
      'number.max': `${prefix}-month`
    }),
  [`${prefix}-year`]: joi
    .number()
    .integer()
    .min(minYear)
    .max(maxYear)
    .required()
    .messages({
      'any.required': `${prefix}-year`,
      'number.base': `${prefix}-year`,
      'number.min': minYearError || `${prefix}-year`,
      'number.max': `${prefix}-year`
    })
})

/**
 * Validates if a date object matches its components
 * @param {object} params - Parameters object
 * @param {Date} params.date - Date object to validate
 * @param {number} params.day - Day component
 * @param {number} params.month - Month component
 * @param {number} params.year - Year component
 * @returns {boolean} True if date matches components
 */
const isValidDate = ({ date, day, month, year }) =>
  date.getUTCFullYear() === year &&
  date.getUTCMonth() === month - 1 &&
  date.getUTCDate() === day

/**
 * Activity dates schema for start and end date validation
 */
export const activityDatesSchema = joi
  .object({
    ...individualDate({
      prefix: 'activity-start-date',
      minYear: MIN_YEAR,
      maxYear: MAX_YEAR,
      minYearError: JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE
    }),
    ...individualDate({
      prefix: 'activity-end-date',
      minYear: MIN_YEAR,
      maxYear: MAX_YEAR,
      minYearError: JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Validate start date is a real date
    if (
      !isValidDate({
        date: startDate,
        day: startDay,
        month: startMonth,
        year: startYear
      })
    ) {
      return helpers.error('custom.startDate.invalid')
    }

    // Validate end date is a real date
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

    // Check end date future validation before date order (for consistency with existing behavior)
    if (endDate < today) {
      return helpers.error('custom.endDate.todayOrFuture')
    }

    // Validate date order
    if (endDate < startDate) {
      return helpers.error('custom.endDate.before.startDate')
    }

    // Check start date future validation last
    if (startDate < today) {
      return helpers.error('custom.startDate.todayOrFuture')
    }

    return value
  })
  .messages({
    'activity-start-date-day': JOI_ERRORS.ACTIVITY_START_DATE_DAY,
    'activity-start-date-month': JOI_ERRORS.ACTIVITY_START_DATE_MONTH,
    'activity-start-date-year': JOI_ERRORS.ACTIVITY_START_DATE_YEAR,
    'activity-end-date-day': JOI_ERRORS.ACTIVITY_END_DATE_DAY,
    'activity-end-date-month': JOI_ERRORS.ACTIVITY_END_DATE_MONTH,
    'activity-end-date-year': JOI_ERRORS.ACTIVITY_END_DATE_YEAR,
    'custom.startDate.todayOrFuture':
      JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE,
    'custom.startDate.invalid': JOI_ERRORS.CUSTOM_START_DATE_INVALID,
    'custom.endDate.invalid': JOI_ERRORS.CUSTOM_END_DATE_INVALID,
    'custom.endDate.todayOrFuture': JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE,
    'custom.endDate.before.startDate':
      JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE
  })

// Export constants for reuse
export {
  MIN_YEAR,
  MAX_YEAR,
  MAX_YEAR_OFFSET,
  MAX_DAYS_IN_MONTH,
  MAX_MONTHS_IN_YEAR
}
