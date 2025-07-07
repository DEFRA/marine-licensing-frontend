import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import {
  createErrorTypeMap,
  generateDateErrorMessages,
  getDateErrorMessage,
  isCompleteDateMissing
} from './date-error-utils.js'
import {
  createDateFieldNames,
  createDateFieldsFromValue,
  extractDateFieldsFromPayload,
  extractMultipleDateFields
} from './date-utils.js'

export {
  createDateFieldNames,
  createDateFieldsFromValue,
  createErrorTypeMap,
  extractDateFieldsFromPayload,
  extractMultipleDateFields,
  getDateErrorMessage,
  isCompleteDateMissing
}

function createErrorSummaryItem(prefix, errorMessage) {
  const dateFieldNames = createDateFieldNames(prefix)
  return {
    href: `#${dateFieldNames.DAY}`,
    text: errorMessage
  }
}

function buildSimplifiedErrorSummary(errorDetails, dateConfigs, errorMessages) {
  const errorSummary = []
  const errorTypeMap = createErrorTypeMap(errorDetails)
  const basicErrorSummary = mapErrorsForDisplay(errorDetails, errorMessages)
  const errors = errorDescriptionByFieldName(basicErrorSummary)

  // Sort configs so START dates come first
  const sortedConfigs = [...dateConfigs].sort((config) =>
    config.prefix.includes('start') ? -1 : 1
  )

  // Process each date configuration
  sortedConfigs.forEach((config) => {
    processDateConfig.call(this, config, errors, errorTypeMap, errorSummary)
  })

  // Add any non-date errors
  basicErrorSummary.forEach((error) => {
    if (shouldIncludeError(error, dateConfigs)) {
      errorSummary.push(error)
    }
  })

  function shouldIncludeError(error, dateConfigs) {
    const isDateError = dateConfigs.some((config) =>
      error.field?.[0]?.includes(config.prefix)
    )
    const hasValidHref = error.href !== '#' && error.href !== '#undefined'
    return !isDateError && hasValidHref
  }

  return errorSummary

  function processDateConfig(config, errors, errorTypeMap, errorSummary) {
    if (handleMissingDateError(config, errors, errorSummary)) return
    if (handleCustomValidationErrors(config, errorTypeMap, errorSummary)) return
    handleIndividualFieldErrors(config, errors, errorSummary)
  }

  function handleMissingDateError(config, errors, errorSummary) {
    if (isCompleteDateMissing(errors, config.prefix, config.fieldErrorKeys)) {
      errorSummary.push(
        createErrorSummaryItem(
          config.prefix,
          config.errorMessages[config.errorKeys.MISSING]
        )
      )
      return true
    }
    return false
  }

  function handleCustomValidationErrors(config, errorTypeMap, errorSummary) {
    const { prefix, errorKeys, errorMessages } = config
    const validationChecks = [
      {
        key: errorKeys.TODAY_OR_FUTURE,
        message: errorMessages[errorKeys.TODAY_OR_FUTURE]
      },
      { key: errorKeys.INVALID, message: errorMessages[errorKeys.INVALID] },
      {
        key: errorKeys.BEFORE_OTHER_DATE,
        message: errorMessages[errorKeys.BEFORE_OTHER_DATE]
      }
    ]

    for (const check of validationChecks) {
      if (check.key && errorTypeMap[check.key]) {
        errorSummary.push(createErrorSummaryItem(prefix, check.message))
        return true
      }
    }
    return false
  }

  function handleIndividualFieldErrors(config, errors, errorSummary) {
    const { prefix, errorKeys, errorMessages, fieldErrorKeys } = config
    const fieldNames = createDateFieldNames(prefix)
    const fieldChecks = [
      {
        field: fieldErrorKeys[fieldNames.DAY],
        message: errorMessages[errorKeys.DAY]
      },
      {
        field: fieldErrorKeys[fieldNames.MONTH],
        message: errorMessages[errorKeys.MONTH]
      },
      {
        field: fieldErrorKeys[fieldNames.YEAR],
        message: errorMessages[errorKeys.YEAR]
      }
    ]

    fieldChecks.forEach((check) => {
      if (errors[check.field]) {
        errorSummary.push(createErrorSummaryItem(prefix, check.message))
      }
    })
  }
}

export function processDateValidationErrors(err, dateConfigs, errorMessages) {
  if (!err.details) {
    return null
  }

  const errorSummary = buildSimplifiedErrorSummary(
    err.details,
    dateConfigs,
    errorMessages
  )
  const errors = errorDescriptionByFieldName(
    mapErrorsForDisplay(err.details, errorMessages)
  )
  const dateErrorMessages = generateDateErrorMessages({
    dateConfigs,
    errorDetails: err.details,
    errorMessages
  })

  return {
    errors,
    errorSummary,
    ...dateErrorMessages
  }
}
