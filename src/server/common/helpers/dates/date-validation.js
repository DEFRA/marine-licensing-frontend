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

function validateDateFields(dateFields, prefix, type) {
  const config = { prefix, type }

  const missingFieldErrors = checkMissingFields(dateFields, config)
  if (missingFieldErrors.length > 0) {
    return { errors: missingFieldErrors, date: null }
  }

  const { errors: completeErrors, date } = validateCompleteDate(
    dateFields,
    config
  )
  return { errors: completeErrors, date }

  function checkMissingFields({ day, month, year }, dateConfig) {
    const hasAnyField = day || month || year
    const hasAllFields = day && month && year

    if (!hasAnyField) {
      return [
        createErrorSummaryItem(
          `activity-${dateConfig.prefix}-date-day`,
          `Enter the ${dateConfig.type} date`
        )
      ]
    }

    if (!hasAllFields) {
      const fieldChecks = [
        { value: day, name: 'day' },
        { value: month, name: 'month' },
        { value: year, name: 'year' }
      ]

      return fieldChecks
        .filter((field) => !field.value)
        .map((field) =>
          createErrorSummaryItem(
            `activity-${dateConfig.prefix}-date-${field.name}`,
            `The ${dateConfig.type} date must include a ${field.name}`
          )
        )
    }

    return []
  }

  function validateCompleteDate({ day, month, year }, dateConfig) {
    const dateISO = createDateISO(year, month, day)
    if (!dateISO) {
      return {
        errors: [
          createErrorSummaryItem(
            `activity-${dateConfig.prefix}-date-day`,
            `The ${dateConfig.type} date must be a real date`
          )
        ],
        date: null
      }
    }

    if (!isTodayOrFuture(dateISO)) {
      return {
        errors: [
          createErrorSummaryItem(
            `activity-${dateConfig.prefix}-date-day`,
            `The ${dateConfig.type} date must be today or in the future`
          )
        ],
        date: dateISO
      }
    }

    return { errors: [], date: dateISO }
  }
}

export function validateActivityDates(payload) {
  const startDate = extractDateFieldsFromPayload(payload, 'activity-start-date')
  const endDate = extractDateFieldsFromPayload(payload, 'activity-end-date')

  const startResult = validateDateFields(startDate, 'start', 'start')
  const endResult = validateDateFields(endDate, 'end', 'end')

  const errors = [...startResult.errors, ...endResult.errors]

  if (shouldCheckDateOrder(startResult.date, endResult.date)) {
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
