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

export const validateYearWithinAllowedRange = (value, helpers, field) => {
  const currentMinYear = getMinYear()
  const currentMaxYear = getMaxYear()

  const isBelowMinimumYear = value < currentMinYear

  if (isBelowMinimumYear) {
    return helpers.error('number.min')
  }

  const isAboveMaximumYear = value > currentMaxYear

  if (isAboveMaximumYear) {
    return helpers.error(`custom.${field}.tooFarFuture`)
  }

  return value
}

export const validateDateTooFarApart = (startDate, endDate, helpers) => {
  const oneYearFromStartDate = startDate.add(1, 'year')
  const isEndDateMoreThanOneYearFromStart = endDate.isAfter(oneYearFromStartDate, 'day')

  if (isEndDateMoreThanOneYearFromStart) {
    return helpers.error('custom.endDate.tooFarApart')
  }

  return null
}
