import joi from 'joi'
import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR = CURRENT_YEAR - 10 // Allow 10 years in the past for reasonable range validation
const MAX_YEAR = CURRENT_YEAR + 75
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
    const startDay = parseInt(value['activity-start-date-day'], 10)
    const startMonth = parseInt(value['activity-start-date-month'], 10)
    const startYear = parseInt(value['activity-start-date-year'], 10)

    const endDay = parseInt(value['activity-end-date-day'], 10)
    const endMonth = parseInt(value['activity-end-date-month'], 10)
    const endYear = parseInt(value['activity-end-date-year'], 10)

    if (isNaN(startDay) || isNaN(startMonth) || isNaN(startYear)) {
      return helpers.error(JOI_ERRORS.CUSTOM_START_DATE_INVALID)
    }

    if (isNaN(endDay) || isNaN(endMonth) || isNaN(endYear)) {
      return helpers.error(JOI_ERRORS.CUSTOM_END_DATE_INVALID)
    }

    if (
      startDay < 1 ||
      startDay > MAX_DAYS_IN_MONTH ||
      startMonth < 1 ||
      startMonth > MAX_MONTHS_IN_YEAR ||
      startYear < MIN_YEAR ||
      startYear > MAX_YEAR
    ) {
      return helpers.error(JOI_ERRORS.CUSTOM_START_DATE_INVALID)
    }

    if (
      endDay < 1 ||
      endDay > MAX_DAYS_IN_MONTH ||
      endMonth < 1 ||
      endMonth > MAX_MONTHS_IN_YEAR ||
      endYear < MIN_YEAR ||
      endYear > MAX_YEAR
    ) {
      return helpers.error(JOI_ERRORS.CUSTOM_END_DATE_INVALID)
    }

    const startDate = createDateFromComponents(startYear, startMonth, startDay)
    if (!startDate) {
      return helpers.error(JOI_ERRORS.CUSTOM_START_DATE_INVALID)
    }

    const endDate = createDateFromComponents(endYear, endMonth, endDay)
    if (!endDate) {
      return helpers.error(JOI_ERRORS.CUSTOM_END_DATE_INVALID)
    }

    // REORDER: Check date relationships BEFORE checking if dates are in the future
    // This ensures more specific error messages are shown first
    if (endDate < startDate) {
      return helpers.error(JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE)
    }

    if (!isDateTodayOrFuture(startDate)) {
      return helpers.error(JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE)
    }

    if (!isDateTodayOrFuture(endDate)) {
      return helpers.error(JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE)
    }

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
