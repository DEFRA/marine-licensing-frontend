import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import {
  addCustomValidationErrors,
  cleanErrorSummary,
  collectMissingDates,
  createErrorTypeMap,
  generateDateErrorMessages,
  getDateErrorMessage,
  handleMissingDateErrors,
  isCompleteDateMissing
} from './date-error-utils.js'
import {
  createDateFieldNames,
  createDateFieldsFromValue,
  extractDateFieldsFromPayload,
  extractMultipleDateFields
} from './date-utils.js'

export {
  addCustomValidationErrors,
  createDateFieldNames,
  createDateFieldsFromValue,
  createErrorTypeMap,
  extractDateFieldsFromPayload,
  extractMultipleDateFields,
  getDateErrorMessage,
  handleMissingDateErrors,
  isCompleteDateMissing
}

export function processDateValidationErrors(err, dateConfigs, errorMessages) {
  if (!err.details) {
    return null
  }

  const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
  const errors = errorDescriptionByFieldName(errorSummary)
  const errorTypeMap = createErrorTypeMap(err.details)
  const missingDates = collectMissingDates(dateConfigs, errors)

  // Process error summary inline
  let modifiedErrorSummary = cleanErrorSummary(errorSummary)
  addCustomValidationErrors(modifiedErrorSummary, errorTypeMap, dateConfigs)
  modifiedErrorSummary = handleMissingDateErrors(
    modifiedErrorSummary,
    missingDates
  )

  const dateErrorMessages = generateDateErrorMessages({
    dateConfigs,
    missingDates,
    errorTypeMap,
    errors,
    errorMessages
  })

  return {
    errors,
    errorSummary: modifiedErrorSummary,
    ...dateErrorMessages
  }
}
