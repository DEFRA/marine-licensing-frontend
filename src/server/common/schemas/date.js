import joi from 'joi'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import { JOI_ERRORS } from '#src/server/common/constants/joi.js'
import {
  validateYearWithinAllowedRange,
  validateDateTooFarApart,
  validateDatesNotInPast,
  validateDateTooFarInFuture
} from './date-schema-utils.js'

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const DATE_FORMAT_ISO = 'YYYY-MM-DD'

export const individualDate = ({ prefix, minYearError, field }) => {
  return {
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
      .required()
      .custom((value, helpers) =>
        validateYearWithinAllowedRange(value, helpers, field)
      )
      .messages({
        'any.required': `${prefix}-year`,
        'number.base': `${prefix}-year`,
        'number.min': minYearError || `${prefix}-year`,
        'number.max': `${prefix}-year`
      })
  }
}
const isValidDate = (year, month, day) => {
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
export const activityDatesSchema = joi
  .object({
    ...individualDate({
      prefix: 'activity-start-date',
      field: 'startDate',
      minYearError: JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE
    }),
    ...individualDate({
      prefix: 'activity-end-date',
      field: 'endDate',
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

    const startDateValid = isValidDate(startYear, startMonth, startDay)

    if (!startDateValid) {
      return helpers.error('custom.startDate.invalid')
    }

    const endDateValid = isValidDate(endYear, endMonth, endDay)

    if (!endDateValid) {
      return helpers.error('custom.endDate.invalid')
    }

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
    if (endDate.isBefore(startDate, 'day')) {
      return helpers.error('custom.endDate.before.startDate')
    }

    const areDatesTooFarInFuture = validateDateTooFarInFuture(
      startDate,
      endDate,
      helpers
    )

    if (areDatesTooFarInFuture) {
      return areDatesTooFarInFuture
    }

    const areDatesTooFarApart = validateDateTooFarApart(
      startDate,
      endDate,
      helpers
    )

    if (areDatesTooFarApart) {
      return areDatesTooFarApart
    }

    const pastDateValidationError = validateDatesNotInPast(
      startDate,
      endDate,
      today,
      helpers
    )

    if (pastDateValidationError) {
      return pastDateValidationError
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
      JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE,
    'custom.startDate.tooFarFuture':
      JOI_ERRORS.CUSTOM_START_DATE_TOO_FAR_FUTURE,
    'custom.endDate.tooFarFuture': JOI_ERRORS.CUSTOM_END_DATE_TOO_FAR_FUTURE,
    'custom.endDate.tooFarApart': JOI_ERRORS.CUSTOM_END_DATE_TOO_FAR_APART
  })
