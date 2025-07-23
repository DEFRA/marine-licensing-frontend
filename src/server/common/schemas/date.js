import joi from 'joi'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const MIN_YEAR = dayjs().year()
const MAX_YEAR_OFFSET = 75
const MAX_YEAR = MIN_YEAR + MAX_YEAR_OFFSET

// Date format constants
const DATE_FORMAT_ISO = 'YYYY-MM-DD'

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
    .required()
    .messages({
      'any.required': `${prefix}-day`,
      'number.base': `${prefix}-day`,
      'number.min': `${prefix}-day`
    }),
  [`${prefix}-month`]: joi
    .number()
    .integer()
    .min(1)
    .required()
    .messages({
      'any.required': `${prefix}-month`,
      'number.base': `${prefix}-month`,
      'number.min': `${prefix}-month`
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
 * Validates if date components form a valid Day.js date
 * @param {number} year - Year component
 * @param {number} month - Month component (1-12)
 * @param {number} day - Day component (1-31)
 * @returns {boolean} True if date is valid
 */
const isValidDate = (year, month, day) => {
  // Create the date with strict parsing
  const date = dayjs.utc(
    `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    DATE_FORMAT_ISO,
    true
  )

  // Check if Day.js created a valid date AND the components match exactly
  // This prevents Day.js from "correcting" invalid dates like Feb 30th -> Mar 2nd
  if (!date.isValid()) {
    return false
  }

  // Verify the parsed date components match the input exactly
  return (
    date.year() === year &&
    date.month() + 1 === month && // Day.js months are 0-indexed
    date.date() === day
  )
}

/**
 * Activity dates schema for start and end date validation using Day.js
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

    // Validate start date components form a valid date
    if (!isValidDate(startYear, startMonth, startDay)) {
      return helpers.error('custom.startDate.invalid')
    }

    // Validate end date components form a valid date
    if (!isValidDate(endYear, endMonth, endDay)) {
      return helpers.error('custom.endDate.invalid')
    }

    // Create Day.js dates for comparison (we know they're valid now)
    const startDate = dayjs.utc(
      `${startYear}-${startMonth.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`,
      DATE_FORMAT_ISO
    )
    const endDate = dayjs.utc(
      `${endYear}-${endMonth.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`,
      DATE_FORMAT_ISO
    )
    const today = dayjs.utc().startOf('day')

    // Check date order first - if end date is before start date, show that error
    // regardless of whether dates are in the past
    if (endDate.isBefore(startDate, 'day')) {
      return helpers.error('custom.endDate.before.startDate')
    }

    // Then check future date validation for end date
    if (endDate.isBefore(today, 'day')) {
      return helpers.error('custom.endDate.todayOrFuture')
    }

    // Check start date future validation last
    if (startDate.isBefore(today, 'day')) {
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
