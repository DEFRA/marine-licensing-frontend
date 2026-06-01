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

const mapStartError = (hasMonth, hasYear) => {
  if (hasMonth && hasYear) {
    return {
      message: 'PREFERRED_START_DATE_REQUIRED',
      path: [FIELD_START_MONTH]
    }
  }
  if (hasMonth) {
    return { message: START_MONTH, path: [FIELD_START_MONTH] }
  }
  if (hasYear) {
    return { message: START_YEAR, path: [FIELD_START_YEAR] }
  }
  return null
}

const mapEndError = (hasMonth, hasYear) => {
  if (hasMonth && hasYear) {
    return { message: 'PREFERRED_END_DATE_REQUIRED', path: [FIELD_END_MONTH] }
  }
  if (hasMonth) {
    return { message: END_MONTH, path: [FIELD_END_MONTH] }
  }
  if (hasYear) {
    return { message: END_YEAR, path: [FIELD_END_YEAR] }
  }
  return null
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
    mapStartError(hasStartMonth, hasStartYear),
    mapEndError(hasEndMonth, hasEndYear)
  ].filter(Boolean)

  return [...mappedDetails, ...otherDetails]
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
