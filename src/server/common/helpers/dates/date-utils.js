import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const DATE_FORMAT_ISO = 'YYYY-MM-DD'
const DATE_FORMAT_FLEXIBLE = 'YYYY-M-D'

function hasNullValues(year, month, day) {
  return year == null || month == null || day == null
}

export function createDateISO(year, month, day) {
  if (hasNullValues(year, month, day)) {
    return null
  }

  const date = dayjs.utc(
    `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    DATE_FORMAT_ISO,
    true
  )

  return date.isValid() ? date.toISOString() : null
}

export function extractDateComponents(isoDate) {
  if (!isoDate) {
    return { day: '', month: '', year: '' }
  }

  const date = dayjs.utc(isoDate)
  return {
    day: date.date().toString(),
    month: (date.month() + 1).toString(),
    year: date.year().toString()
  }
}

export function formatDate(date, format = 'D MMMM YYYY') {
  return dayjs.utc(date).format(format)
}
export function isValidDateComponents(year, month, day) {
  const date = dayjs.utc(`${year}-${month}-${day}`, DATE_FORMAT_FLEXIBLE, true)
  return date.isValid()
}

export function isTodayOrFuture(date) {
  const inputDate = dayjs.utc(date)
  const today = dayjs.utc().startOf('day')

  return inputDate.isSameOrAfter(today, 'day')
}

export function compareDates(date1, date2) {
  const d1 = dayjs.utc(date1)
  const d2 = dayjs.utc(date2)

  if (d1.isBefore(d2)) {
    return -1
  }
  if (d1.isAfter(d2)) {
    return 1
  }
  return 0
}

export function isEndDateBeforeStartDate(startDate, endDate) {
  const start = dayjs.utc(startDate)
  const end = dayjs.utc(endDate)

  return end.isBefore(start, 'day')
}

export function createDayjsDate(year, month, day) {
  const date = dayjs.utc(`${year}-${month}-${day}`, DATE_FORMAT_FLEXIBLE, true)
  return date.isValid() ? date : null
}

// Field utilities (consolidated from date-field-utils.js)
export function createDateFieldNames(prefix) {
  return {
    DAY: `${prefix}-day`,
    MONTH: `${prefix}-month`,
    YEAR: `${prefix}-year`
  }
}

export function extractDateFieldsFromPayload(payload, prefix) {
  const fieldNames = createDateFieldNames(prefix)
  return {
    day: payload[fieldNames.DAY] || '',
    month: payload[fieldNames.MONTH] || '',
    year: payload[fieldNames.YEAR] || ''
  }
}

export function extractMultipleDateFields(payload, dateConfigs) {
  const result = {}
  for (const { key, prefix } of dateConfigs) {
    const dateFields = extractDateFieldsFromPayload(payload, prefix)
    result[`${key}Day`] = dateFields.day
    result[`${key}Month`] = dateFields.month
    result[`${key}Year`] = dateFields.year
  }
  return result
}

export function createDateFieldsFromValue(dateValue) {
  const components = extractDateComponents(dateValue)
  return {
    day: components.day,
    month: components.month,
    year: components.year
  }
}
