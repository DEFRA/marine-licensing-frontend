import joi from 'joi'
import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS_IN_PAST_ALLOWED = 10 // Allow 10 years in the past for reasonable range validation
const YEARS_IN_FUTURE_ALLOWED = 75 // Allow 75 years in the future for long-term planning
const MIN_YEAR = CURRENT_YEAR - YEARS_IN_PAST_ALLOWED
const MAX_YEAR = CURRENT_YEAR + YEARS_IN_FUTURE_ALLOWED
const MAX_DAYS_IN_MONTH = 31
const MAX_MONTHS_IN_YEAR = 12

/**
 * Creates a date from individual day, month, year components
 * @param {number} year
 * @param {number} month (1-12)
 * @param {number} day
 * @returns {Date|null}
 */
function createDateFromComponents(year, month, day) {
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

/**
 * Checks if a date is today or in the future
 * @param {Date} date
 * @returns {boolean}
 */
function isDateTodayOrFuture(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

/**
 * Validates if date component values are valid numbers
 * @param {number} day
 * @param {number} month
 * @param {number} year
 * @returns {boolean}
 */
function areComponentsValidNumbers(day, month, year) {
  return !isNaN(day) && !isNaN(month) && !isNaN(year)
}

/**
 * Validates if date component values are within valid ranges
 * @param {number} day
 * @param {number} month
 * @param {number} year
 * @returns {boolean}
 */
function areComponentsInValidRange(day, month, year) {
  return (
    day >= 1 &&
    day <= MAX_DAYS_IN_MONTH &&
    month >= 1 &&
    month <= MAX_MONTHS_IN_YEAR &&
    year >= MIN_YEAR &&
    year <= MAX_YEAR
  )
}

/**
 * Extracts and parses date components from form value
 * @param {Object} value - Form data object
 * @returns {Object} Parsed date components
 */
function extractDateComponents(value) {
  return {
    startDay: parseInt(value['activity-start-date-day'], 10),
    startMonth: parseInt(value['activity-start-date-month'], 10),
    startYear: parseInt(value['activity-start-date-year'], 10),
    endDay: parseInt(value['activity-end-date-day'], 10),
    endMonth: parseInt(value['activity-end-date-month'], 10),
    endYear: parseInt(value['activity-end-date-year'], 10)
  }
}

/**
 * Validates start date components and returns error if invalid
 * @param {number} startDay
 * @param {number} startMonth
 * @param {number} startYear
 * @param {Object} helpers - Joi helpers object
 * @returns {Object|null} Error object or null if valid
 */
function validateStartDateComponents(startDay, startMonth, startYear, helpers) {
  if (!areComponentsValidNumbers(startDay, startMonth, startYear)) {
    return helpers.error(JOI_ERRORS.CUSTOM_START_DATE_INVALID)
  }

  if (!areComponentsInValidRange(startDay, startMonth, startYear)) {
    return helpers.error(JOI_ERRORS.CUSTOM_START_DATE_INVALID)
  }

  return null
}

/**
 * Validates end date components and returns error if invalid
 * @param {number} endDay
 * @param {number} endMonth
 * @param {number} endYear
 * @param {Object} helpers - Joi helpers object
 * @returns {Object|null} Error object or null if valid
 */
function validateEndDateComponents(endDay, endMonth, endYear, helpers) {
  if (!areComponentsValidNumbers(endDay, endMonth, endYear)) {
    return helpers.error(JOI_ERRORS.CUSTOM_END_DATE_INVALID)
  }

  if (!areComponentsInValidRange(endDay, endMonth, endYear)) {
    return helpers.error(JOI_ERRORS.CUSTOM_END_DATE_INVALID)
  }

  return null
}

/**
 * Validates date objects and relationships
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {Object} helpers - Joi helpers object
 * @returns {Object|null} Error object or null if valid
 */
function validateDateRelationships(startDate, endDate, helpers) {
  if (!startDate) {
    return helpers.error(JOI_ERRORS.CUSTOM_START_DATE_INVALID)
  }

  if (!endDate) {
    return helpers.error(JOI_ERRORS.CUSTOM_END_DATE_INVALID)
  }

  if (endDate < startDate) {
    return helpers.error(JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE)
  }

  if (!isDateTodayOrFuture(startDate)) {
    return helpers.error(JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE)
  }

  if (!isDateTodayOrFuture(endDate)) {
    return helpers.error(JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE)
  }

  return null
}

export const activityDatesSchema = joi
  .object({
    'activity-start-date-day': joi
      .string()
      .pattern(/^\d+$/)
      .required()
      .messages({
        'any.required': JOI_ERRORS.ACTIVITY_START_DATE_DAY,
        'string.empty': JOI_ERRORS.ACTIVITY_START_DATE_DAY,
        'string.pattern.base': JOI_ERRORS.ACTIVITY_START_DATE_DAY
      }),
    'activity-start-date-month': joi
      .string()
      .pattern(/^\d+$/)
      .required()
      .messages({
        'any.required': JOI_ERRORS.ACTIVITY_START_DATE_MONTH,
        'string.empty': JOI_ERRORS.ACTIVITY_START_DATE_MONTH,
        'string.pattern.base': JOI_ERRORS.ACTIVITY_START_DATE_MONTH
      }),
    'activity-start-date-year': joi
      .string()
      .pattern(/^\d+$/)
      .required()
      .messages({
        'any.required': JOI_ERRORS.ACTIVITY_START_DATE_YEAR,
        'string.empty': JOI_ERRORS.ACTIVITY_START_DATE_YEAR,
        'string.pattern.base': JOI_ERRORS.ACTIVITY_START_DATE_YEAR
      }),
    'activity-end-date-day': joi.string().pattern(/^\d+$/).required().messages({
      'any.required': JOI_ERRORS.ACTIVITY_END_DATE_DAY,
      'string.empty': JOI_ERRORS.ACTIVITY_END_DATE_DAY,
      'string.pattern.base': JOI_ERRORS.ACTIVITY_END_DATE_DAY
    }),
    'activity-end-date-month': joi
      .string()
      .pattern(/^\d+$/)
      .required()
      .messages({
        'any.required': JOI_ERRORS.ACTIVITY_END_DATE_MONTH,
        'string.empty': JOI_ERRORS.ACTIVITY_END_DATE_MONTH,
        'string.pattern.base': JOI_ERRORS.ACTIVITY_END_DATE_MONTH
      }),
    'activity-end-date-year': joi
      .string()
      .pattern(/^\d+$/)
      .required()
      .messages({
        'any.required': JOI_ERRORS.ACTIVITY_END_DATE_YEAR,
        'string.empty': JOI_ERRORS.ACTIVITY_END_DATE_YEAR,
        'string.pattern.base': JOI_ERRORS.ACTIVITY_END_DATE_YEAR
      })
  })
  .custom((value, helpers) => {
    const { startDay, startMonth, startYear, endDay, endMonth, endYear } =
      extractDateComponents(value)

    const startDateError = validateStartDateComponents(
      startDay,
      startMonth,
      startYear,
      helpers
    )
    if (startDateError) return startDateError

    const endDateError = validateEndDateComponents(
      endDay,
      endMonth,
      endYear,
      helpers
    )
    if (endDateError) return endDateError

    const startDate = createDateFromComponents(startYear, startMonth, startDay)
    const endDate = createDateFromComponents(endYear, endMonth, endDay)

    const relationshipError = validateDateRelationships(
      startDate,
      endDate,
      helpers
    )
    if (relationshipError) return relationshipError

    return value
  })
  .messages({
    [JOI_ERRORS.CUSTOM_START_DATE_INVALID]:
      JOI_ERRORS.CUSTOM_START_DATE_INVALID,
    [JOI_ERRORS.CUSTOM_END_DATE_INVALID]: JOI_ERRORS.CUSTOM_END_DATE_INVALID,
    [JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]:
      JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE,
    [JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]:
      JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE,
    [JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]:
      JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE
  })
