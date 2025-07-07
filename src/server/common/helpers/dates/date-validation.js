import {
  createDateISO,
  extractDateFieldsFromPayload,
  isEndDateBeforeStartDate,
  isTodayOrFuture
} from './date-utils.js'

function createErrorSummaryItem(fieldId, message) {
  return {
    href: `#${fieldId}`,
    text: message
  }
}

function validateDateFields(dateFields, prefix, type, errors) {
  const config = { prefix, type }
  const initialErrorCount = errors.length

  checkMissingFields(dateFields, config, errors)
  if (errors.length > initialErrorCount) return

  return validateCompleteDate(dateFields, config, errors)

  function checkMissingFields({ day, month, year }, { prefix, type }, errors) {
    const hasAnyField = day || month || year
    const hasAllFields = day && month && year

    if (!hasAnyField) {
      errors.push(
        createErrorSummaryItem(
          `activity-${prefix}-date-day`,
          `Enter the ${type} date`
        )
      )
      return
    }

    if (!hasAllFields) {
      const fieldChecks = [
        { value: day, name: 'day' },
        { value: month, name: 'month' },
        { value: year, name: 'year' }
      ]

      fieldChecks.forEach((field) => {
        if (!field.value) {
          errors.push(
            createErrorSummaryItem(
              `activity-${prefix}-date-${field.name}`,
              `The ${type} date must include a ${field.name}`
            )
          )
        }
      })
    }
  }

  function validateCompleteDate(
    { day, month, year },
    { prefix, type },
    errors
  ) {
    const dateISO = createDateISO(year, month, day)
    if (!dateISO) {
      errors.push(
        createErrorSummaryItem(
          `activity-${prefix}-date-day`,
          `The ${type} date must be a real date`
        )
      )
      return null
    }

    if (!isTodayOrFuture(dateISO)) {
      errors.push(
        createErrorSummaryItem(
          `activity-${prefix}-date-day`,
          `The ${type} date must be today or in the future`
        )
      )
    }

    return dateISO
  }
}

export function validateActivityDates(payload) {
  const startDate = extractDateFieldsFromPayload(payload, 'activity-start-date')
  const endDate = extractDateFieldsFromPayload(payload, 'activity-end-date')

  const errors = []

  const startDateISO = validateDateFields(startDate, 'start', 'start', errors)
  const endDateISO = validateDateFields(endDate, 'end', 'end', errors)

  if (shouldCheckDateOrder(startDateISO, endDateISO)) {
    errors.push(
      createErrorSummaryItem(
        'activity-end-date-day',
        'The end date must be the same as or after the start date'
      )
    )
  }

  function shouldCheckDateOrder(startISO, endISO) {
    return startISO && endISO && isEndDateBeforeStartDate(startISO, endISO)
  }

  return {
    errorSummary: errors,
    hasErrors: errors.length > 0
  }
}
