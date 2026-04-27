const YEARS_FIELD_ID = 'activity-duration-years'

const combineRequiredErrorsToOne = (details) => [
  {
    message: 'DURATION_REQUIRED',
    path: [YEARS_FIELD_ID],
    hrefOverride: YEARS_FIELD_ID,
    highlightMultipleFields: true
  },
  ...details.filter(
    (detail) =>
      detail.message !== 'YEARS_REQUIRED' &&
      detail.message !== 'MONTHS_REQUIRED'
  )
]

const highlightBothErrorsWhenZeroValues = (detail) => ({
  ...detail,
  path: [YEARS_FIELD_ID],
  hrefOverride: YEARS_FIELD_ID,
  highlightMultipleFields: true
})

export const mapDurationErrors = (details) => {
  if (!Array.isArray(details) || details.length === 0) {
    return []
  }

  const hasYearsRequired = details.some(
    (detail) => detail.message === 'YEARS_REQUIRED'
  )
  const hasMonthsRequired = details.some(
    (detail) => detail.message === 'MONTHS_REQUIRED'
  )

  if (hasYearsRequired && hasMonthsRequired) {
    return combineRequiredErrorsToOne(details)
  }

  return details.map((detail) => {
    if (
      detail.message === 'DURATION_BOTH_ZERO' ||
      detail.message === 'DURATION_REQUIRED'
    ) {
      return highlightBothErrorsWhenZeroValues(detail)
    }

    return detail
  })
}
