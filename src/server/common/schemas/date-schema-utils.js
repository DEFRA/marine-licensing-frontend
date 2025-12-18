import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const MAX_YEAR_OFFSET = 10

const getMinYear = () => {
  return dayjs().year()
}

const getMaxYear = () => {
  return getMinYear() + MAX_YEAR_OFFSET
}

// the following article codes should skip validation and allow past dates
const skipArticleCodes = new Set(['20', '34'])

const shouldSkipArticles = (helpers) => {
  const articleCode = helpers.prefs.context?.articleCode
  return skipArticleCodes.has(articleCode)
}

export const validateYearWithinAllowedRange = (value, helpers, field) => {
  const currentMinYear = getMinYear()
  const currentMaxYear = getMaxYear()

  const shouldSkipMinimumYearCheck = shouldSkipArticles(helpers)

  if (!shouldSkipMinimumYearCheck) {
    const isBelowMinimumYear = value < currentMinYear

    if (isBelowMinimumYear) {
      return helpers.error('number.min')
    }
  }

  const isAboveMaximumYear = value > currentMaxYear

  if (isAboveMaximumYear) {
    return helpers.error(`custom.${field}.tooFarFuture`)
  }

  return value
}

export const validateDateTooFarInFuture = (startDate, endDate, helpers) => {
  const maxDate = dayjs().add(MAX_YEAR_OFFSET, 'years')

  const isStartDateTooFarInFuture = startDate.isAfter(maxDate)

  if (isStartDateTooFarInFuture) {
    return helpers.error('custom.startDate.tooFarFuture')
  }

  const isEndtDateTooFarInFuture = endDate.isAfter(maxDate)

  if (isEndtDateTooFarInFuture) {
    return helpers.error('custom.endDate.tooFarFuture')
  }

  return null
}

export const validateDateTooFarApart = (startDate, endDate, helpers) => {
  const oneYearFromStartDate = startDate.add(1, 'year')
  const isEndDateMoreThanOneYearFromStart = endDate.isAfter(
    oneYearFromStartDate,
    'day'
  )

  if (isEndDateMoreThanOneYearFromStart) {
    return helpers.error('custom.endDate.tooFarApart')
  }

  return null
}

export const validateDatesNotInPast = (startDate, endDate, today, helpers) => {
  const shouldSkipPastDateValidation = shouldSkipArticles(helpers)

  if (shouldSkipPastDateValidation) {
    return null
  }

  if (endDate.isBefore(today, 'day')) {
    return helpers.error('custom.endDate.todayOrFuture')
  }

  if (startDate.isBefore(today, 'day')) {
    return helpers.error('custom.startDate.todayOrFuture')
  }

  return null
}
