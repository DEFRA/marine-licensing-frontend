import {
  isEndDateBeforeStartDate,
  isMonthInPast
} from '#src/server/common/helpers/dates/date-utils.js'

const START_MONTH = 'PREFERRED_START_MONTH_REQUIRED'
const START_YEAR = 'PREFERRED_START_YEAR_REQUIRED'
const END_MONTH = 'PREFERRED_END_MONTH_REQUIRED'
const END_YEAR = 'PREFERRED_END_YEAR_REQUIRED'

const FIELD_START_MONTH = 'start-date-month'
const FIELD_START_YEAR = 'start-date-year'
const FIELD_END_MONTH = 'end-date-month'
const FIELD_END_YEAR = 'end-date-year'

const startEndCodes = new Set([START_MONTH, START_YEAR, END_MONTH, END_YEAR])

const START_INCOMPLETE = 'PREFERRED_START_DATE_REQUIRED'
const END_INCOMPLETE = 'PREFERRED_END_DATE_REQUIRED'

const wholeDateCodes = new Set([
  'PREFERRED_START_DATE_TODAY_OR_FUTURE',
  'PREFERRED_END_DATE_TODAY_OR_FUTURE',
  'PREFERRED_END_DATE_BEFORE_START_DATE'
])

const dateFields = {
  [FIELD_START_MONTH]: [FIELD_START_MONTH, FIELD_START_YEAR],
  [FIELD_START_YEAR]: [FIELD_START_MONTH, FIELD_START_YEAR],
  [FIELD_END_MONTH]: [FIELD_END_MONTH, FIELD_END_YEAR],
  [FIELD_END_YEAR]: [FIELD_END_MONTH, FIELD_END_YEAR]
}

const mapIncompleteError = (
  message,
  hasMonth,
  hasYear,
  monthField,
  yearField
) => {
  if (!hasMonth && !hasYear) {
    return null
  }
  return { message, path: [hasMonth ? monthField : yearField] }
}

export const mapPreferredDatesErrors = (details) => {
  if (!Array.isArray(details) || details.length === 0) {
    return []
  }

  const hasStartMonth = details.some((d) => d.message === START_MONTH)
  const hasStartYear = details.some((d) => d.message === START_YEAR)
  const hasEndMonth = details.some((d) => d.message === END_MONTH)
  const hasEndYear = details.some((d) => d.message === END_YEAR)

  const otherDetails = details.filter((d) => !startEndCodes.has(d.message))
  const mappedDetails = [
    mapIncompleteError(
      START_INCOMPLETE,
      hasStartMonth,
      hasStartYear,
      FIELD_START_MONTH,
      FIELD_START_YEAR
    ),
    mapIncompleteError(
      END_INCOMPLETE,
      hasEndMonth,
      hasEndYear,
      FIELD_END_MONTH,
      FIELD_END_YEAR
    )
  ].filter(Boolean)

  return [...mappedDetails, ...otherDetails]
}

const isBlank = (value) => !value?.toString().trim()

const fieldsForDetail = ({ message, path }, payload) => {
  const [field] = path ?? []
  const fields = dateFields[field]
  if (!fields) {
    return [field]
  }
  if (wholeDateCodes.has(message)) {
    return fields
  }
  if (message === START_INCOMPLETE || message === END_INCOMPLETE) {
    return fields.filter((f) => isBlank(payload?.[f]))
  }
  return [field]
}

export const getErrorFields = (details, payload) => {
  if (!Array.isArray(details)) {
    return []
  }
  const fields = details.flatMap((detail) => fieldsForDetail(detail, payload))
  return [...new Set(fields)]
}

export const validateDateRanges = (payload, now = new Date()) => {
  const startMonth = Number.parseInt(payload[FIELD_START_MONTH], 10)
  const startYear = Number.parseInt(payload[FIELD_START_YEAR], 10)
  const endMonth = Number.parseInt(payload[FIELD_END_MONTH], 10)
  const endYear = Number.parseInt(payload[FIELD_END_YEAR], 10)
  const details = []

  if (isMonthInPast(startYear, startMonth, now)) {
    details.push({
      message: 'PREFERRED_START_DATE_TODAY_OR_FUTURE',
      path: [FIELD_START_MONTH]
    })
  }

  if (isMonthInPast(endYear, endMonth, now)) {
    details.push({
      message: 'PREFERRED_END_DATE_TODAY_OR_FUTURE',
      path: [FIELD_END_MONTH]
    })
  }

  if (details.length === 0) {
    const startDateStr = `${startYear}-${String(startMonth).padStart(2, '0')}-01`
    const endDateStr = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

    if (isEndDateBeforeStartDate(startDateStr, endDateStr)) {
      details.push({
        message: 'PREFERRED_END_DATE_BEFORE_START_DATE',
        path: [FIELD_END_MONTH]
      })
    }
  }

  return details
}
