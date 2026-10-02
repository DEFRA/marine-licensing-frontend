import {
  isAfterToday,
  isRealDate
} from '#src/server/common/helpers/dates/date-validation.js'

const FIELD_DAY = 'date-displayed-day'
const DATE_PARTS = 3

const REQUIRED = 'DATE_DISPLAYED_REQUIRED'
const INVALID = 'DATE_DISPLAYED_DATE_INVALID'
const FUTURE = 'DATE_DISPLAYED_DATE_TODAY_OR_PAST'

const isMissing = (detail) => detail.message?.endsWith('_REQUIRED')

const pickMessage = (details) => {
  if (details.filter(isMissing).length === DATE_PARTS) {
    return REQUIRED
  }
  if (details.some((detail) => detail.message === FUTURE)) {
    return FUTURE
  }
  return INVALID
}

export const mapDateDisplayedErrors = (details = []) =>
  details.length > 0
    ? [{ message: pickMessage(details), path: [FIELD_DAY] }]
    : []

export const validateDateDisplayed = (date, now) => {
  if (!isRealDate(date)) {
    return [{ message: INVALID, path: [FIELD_DAY] }]
  }
  if (isAfterToday(date, now)) {
    return [{ message: FUTURE, path: [FIELD_DAY] }]
  }
  return []
}
