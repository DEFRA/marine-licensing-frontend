import { createDateFieldNames } from './date-utils.js'

export function createErrorTypeMap(errorDetails) {
  const errorTypeMap = {}
  errorDetails.forEach((detail) => {
    errorTypeMap[detail.type] = detail
    if (detail.path && detail.path.length > 0) {
      errorTypeMap[detail.path[0]] = detail
    }
    if (detail.message !== detail.type) {
      errorTypeMap[detail.message] = detail
    }
  })
  return errorTypeMap
}

export function isCompleteDateMissing(errors, prefix, fieldErrorKeys) {
  const fieldNames = createDateFieldNames(prefix)
  const dayError = fieldErrorKeys[fieldNames.DAY]
  const monthError = fieldErrorKeys[fieldNames.MONTH]
  const yearError = fieldErrorKeys[fieldNames.YEAR]

  return errors[dayError] && errors[monthError] && errors[yearError]
}

function createErrorPriority({
  errorKeys,
  isDateMissing,
  errorTypeMap,
  errors
}) {
  return [
    {
      condition: isDateMissing,
      key: errorKeys.MISSING
    },
    {
      condition: errorTypeMap[errorKeys.INVALID],
      key: errorKeys.INVALID
    },
    {
      condition: errorTypeMap[errorKeys.TODAY_OR_FUTURE],
      key: errorKeys.TODAY_OR_FUTURE
    },
    {
      condition: errorTypeMap[errorKeys.BEFORE_OTHER_DATE],
      key: errorKeys.BEFORE_OTHER_DATE
    },
    {
      condition: errors[errorKeys.DAY],
      key: errorKeys.DAY
    },
    {
      condition: errors[errorKeys.MONTH],
      key: errorKeys.MONTH
    },
    {
      condition: errors[errorKeys.YEAR],
      key: errorKeys.YEAR
    }
  ].filter((error) => error.key)
}

export function getDateErrorMessage({
  isDateMissing,
  errorTypeMap,
  errors,
  errorKeys,
  errorMessages
}) {
  const errorPriority = createErrorPriority({
    errorKeys,
    isDateMissing,
    errorTypeMap,
    errors
  })

  const errorToShow = errorPriority.find((error) => error.condition)
  return errorToShow ? { text: errorMessages[errorToShow.key] } : null
}

// Error summary management (consolidated from date-error-summary-utils.js)
function addErrorToSummary(errorSummary, prefix, errorMessage) {
  const dateFieldNames = createDateFieldNames(prefix)
  errorSummary.push({
    href: `#${dateFieldNames.DAY}`,
    text: errorMessage
  })
}

function addTodayOrFutureError(errorSummary, errorTypeMap, config) {
  const { errorKeys, errorMessages } = config
  if (errorKeys.TODAY_OR_FUTURE && errorTypeMap[errorKeys.TODAY_OR_FUTURE]) {
    addErrorToSummary(
      errorSummary,
      config.prefix,
      errorMessages[errorKeys.TODAY_OR_FUTURE]
    )
    return true
  }
  return false
}

function addInvalidDateError(
  errorSummary,
  errorTypeMap,
  config,
  dateErrorAdded
) {
  const { prefix, errorKeys, errorMessages } = config
  const hasInvalidDateError =
    errorKeys.INVALID && errorTypeMap[errorKeys.INVALID]

  if (!dateErrorAdded && hasInvalidDateError) {
    addErrorToSummary(errorSummary, prefix, errorMessages[errorKeys.INVALID])
  }
}

function addBeforeOtherDateError(errorSummary, errorTypeMap, config) {
  const { prefix, errorKeys, errorMessages } = config
  if (
    errorKeys.BEFORE_OTHER_DATE &&
    errorTypeMap[errorKeys.BEFORE_OTHER_DATE]
  ) {
    addErrorToSummary(
      errorSummary,
      prefix,
      errorMessages[errorKeys.BEFORE_OTHER_DATE]
    )
  }
}

function addDateValidationError(errorSummary, errorTypeMap, config) {
  const dateErrorAdded = addTodayOrFutureError(
    errorSummary,
    errorTypeMap,
    config
  )
  addInvalidDateError(errorSummary, errorTypeMap, config, dateErrorAdded)
  addBeforeOtherDateError(errorSummary, errorTypeMap, config)
}

export function addCustomValidationErrors(
  errorSummary,
  errorTypeMap,
  dateConfigs
) {
  dateConfigs.forEach((config) => {
    addDateValidationError(errorSummary, errorTypeMap, config)
  })
}

export function handleMissingDateErrors(errorSummary, missingDates) {
  let modifiedSummary = [...errorSummary]

  missingDates.forEach(({ prefix, errorKey, errorMessage, fieldNames }) => {
    modifiedSummary = modifiedSummary.filter(
      (error) => !error.href.includes(`#${prefix}`)
    )

    const position = errorKey.includes('START') ? 'unshift' : 'push'
    modifiedSummary[position]({
      href: `#${fieldNames.DAY}`,
      text: errorMessage
    })
  })

  return modifiedSummary
}

export function cleanErrorSummary(errorSummary) {
  return errorSummary.filter(
    (error) => error.href && error.href !== '#' && error.href !== '#undefined'
  )
}

export function collectMissingDates(dateConfigs, errors) {
  const missingDates = []
  dateConfigs.forEach((config) => {
    const isDateMissing = isCompleteDateMissing(
      errors,
      config.prefix,
      config.fieldErrorKeys
    )
    if (isDateMissing) {
      missingDates.push({
        prefix: config.prefix,
        errorKey: config.errorKeys.MISSING,
        errorMessage: config.errorMessages[config.errorKeys.MISSING],
        fieldNames: config.fieldNames
      })
    }
  })
  return missingDates
}

export function generateDateErrorMessages({
  dateConfigs,
  missingDates,
  errorTypeMap,
  errors,
  errorMessages
}) {
  const dateErrorMessages = {}
  dateConfigs.forEach((config) => {
    const isDateMissing = missingDates.some(
      (missing) => missing.prefix === config.prefix
    )
    const errorMessage = getDateErrorMessage({
      isDateMissing,
      errorTypeMap,
      errors,
      errorKeys: config.errorKeys,
      errorMessages
    })
    dateErrorMessages[config.errorMessageKey] = errorMessage
  })
  return dateErrorMessages
}
