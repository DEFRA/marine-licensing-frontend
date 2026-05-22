import {
  isEndDateBeforeStartDate,
  isMonthInPast
} from '#src/server/common/helpers/dates/date-utils.js'

const START_MONTH = 'PREFERRED_START_MONTH_REQUIRED'
const START_YEAR = 'PREFERRED_START_YEAR_REQUIRED'
const END_MONTH = 'PREFERRED_END_MONTH_REQUIRED'
const END_YEAR = 'PREFERRED_END_YEAR_REQUIRED'

const startEndCodes = [START_MONTH, START_YEAR, END_MONTH, END_YEAR]

const mapStartError = (hasMonth, hasYear) => {
  if (hasMonth && hasYear) {
    return {
      message: 'PREFERRED_START_DATE_REQUIRED',
      path: ['start-date-month']
    }
  }
  if (hasMonth) {
    return { message: START_MONTH, path: ['start-date-month'] }
  }
  if (hasYear) {
    return { message: START_YEAR, path: ['start-date-year'] }
  }
  return null
}

const mapEndError = (hasMonth, hasYear) => {
  if (hasMonth && hasYear) {
    return { message: 'PREFERRED_END_DATE_REQUIRED', path: ['end-date-month'] }
  }
  if (hasMonth) {
    return { message: END_MONTH, path: ['end-date-month'] }
  }
  if (hasYear) {
    return { message: END_YEAR, path: ['end-date-year'] }
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

  const otherDetails = details.filter((d) => !startEndCodes.includes(d.message))
  const mappedDetails = [
    mapStartError(hasStartMonth, hasStartYear),
    mapEndError(hasEndMonth, hasEndYear)
  ].filter(Boolean)

  return [...mappedDetails, ...otherDetails]
}

export const validateDateRanges = (payload, now = new Date()) => {
  const startMonth = parseInt(payload['start-date-month'], 10)
  const startYear = parseInt(payload['start-date-year'], 10)
  const endMonth = parseInt(payload['end-date-month'], 10)
  const endYear = parseInt(payload['end-date-year'], 10)
  const details = []

  if (isMonthInPast(startYear, startMonth, now)) {
    details.push({
      message: 'PREFERRED_START_DATE_TODAY_OR_FUTURE',
      path: ['start-date-month']
    })
  }

  if (isMonthInPast(endYear, endMonth, now)) {
    details.push({
      message: 'PREFERRED_END_DATE_TODAY_OR_FUTURE',
      path: ['end-date-month']
    })
  }

  if (details.length === 0) {
    const startDateStr = `${startYear}-${String(startMonth).padStart(2, '0')}-01`
    const endDateStr = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

    if (isEndDateBeforeStartDate(startDateStr, endDateStr)) {
      details.push({
        message: 'PREFERRED_END_DATE_BEFORE_START_DATE',
        path: ['end-date-month']
      })
    }
  }

  return details
}
