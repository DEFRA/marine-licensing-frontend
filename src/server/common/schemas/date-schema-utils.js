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

export const validateYearWithinAllowedRange = (value, helpers) => {
  const currentMinYear = getMinYear()
  const currentMaxYear = getMaxYear()

  const isBelowMinimumYear = value < currentMinYear

  if (isBelowMinimumYear) {
    return helpers.error('number.min')
  }

  const isAboveMaximumYear = value > currentMaxYear

  if (isAboveMaximumYear) {
    return helpers.error('number.max')
  }

  return value
}
