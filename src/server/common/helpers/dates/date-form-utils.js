import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
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

  const sortedConfigs = [...dateConfigs].sort((config) =>
    config.prefix.includes('start') ? -1 : 1
  )

  for (const config of sortedConfigs) {
    validateConfigFields(config, errors, errorSummary, errorTypeMap)
  }

  addNonDateErrors(basicErrorSummary, dateConfigs, errorSummary)

  return errorSummary
}

function validateConfigFields(config, errors, errorSummary, errorTypeMap) {
  const { prefix, fieldErrorKeys, errorKeys, errorMessages } = config

  if (isCompleteDateMissing(errors, prefix, fieldErrorKeys)) {
    errorSummary.push(
      createErrorSummaryItem(prefix, errorMessages[errorKeys.MISSING])
    )
    return
  }

  if (hasCustomValidationError(config, errorTypeMap, errorSummary)) {
    return
  }

  const fieldNames = createDateFieldNames(prefix)
  const dayError = errors[fieldErrorKeys[fieldNames.DAY]]
  const monthError = errors[fieldErrorKeys[fieldNames.MONTH]]
  const yearError = errors[fieldErrorKeys[fieldNames.YEAR]]

  if (dayError) {
    const dayMaxKey = `${fieldNames.DAY}-max`
    const errorKey = errorTypeMap[dayMaxKey] ? dayMaxKey : errorKeys.DAY
    errorSummary.push(
      createErrorSummaryItem(
        prefix,
        errorMessages[errorKey] || errorMessages[errorKeys.DAY]
      )
    )
  }
  if (monthError) {
    const monthMaxKey = `${fieldNames.MONTH}-max`
    const errorKey = errorTypeMap[monthMaxKey] ? monthMaxKey : errorKeys.MONTH
    errorSummary.push(
      createErrorSummaryItem(
        prefix,
        errorMessages[errorKey] || errorMessages[errorKeys.MONTH]
      )
    )
  }
  if (yearError) {
    errorSummary.push(
      createErrorSummaryItem(prefix, errorMessages[errorKeys.YEAR])
    )
  }
}
function hasCustomValidationError(config, errorTypeMap, errorSummary) {
  const { prefix, errorKeys, errorMessages } = config
  const checks = [
    {
      key: errorKeys.TODAY_OR_FUTURE,
      message: errorMessages[errorKeys.TODAY_OR_FUTURE]
    },
    { key: errorKeys.INVALID, message: errorMessages[errorKeys.INVALID] },
    {
      key: errorKeys.BEFORE_OTHER_DATE,
      message: errorMessages[errorKeys.BEFORE_OTHER_DATE]
    },
    {
      key: errorKeys.TOO_FAR_FUTURE,
      message: errorMessages[errorKeys.TOO_FAR_FUTURE]
    },
    {
      key: errorKeys.TOO_FAR_APART,
      message: errorMessages[errorKeys.TOO_FAR_APART]
    }
  ]

  for (const check of checks) {
    if (check.key && errorTypeMap[check.key]) {
      errorSummary.push(createErrorSummaryItem(prefix, check.message))
      return true
    }
  }
  return false
}

function addNonDateErrors(basicErrorSummary, dateConfigs, errorSummary) {
  for (const error of basicErrorSummary) {
    const isDateError = dateConfigs.some((config) =>
      error.field?.[0]?.includes(config.prefix)
    )
    const hasValidHref = error.href !== '#' && error.href !== '#undefined'

    if (!isDateError && hasValidHref) {
      errorSummary.push(error)
    }
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
