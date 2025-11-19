import { createDateFieldNames } from './date-utils.js'

export function createErrorTypeMap(errorDetails) {
  const errorTypeMap = {}
  for (const detail of errorDetails) {
    errorTypeMap[detail.type] = detail
    if (detail.path && detail.path.length > 0) {
      errorTypeMap[detail.path[0]] = detail
    }
    if (detail.message !== detail.type) {
      errorTypeMap[detail.message] = detail
    }
  }
  return errorTypeMap
}

export function isCompleteDateMissing(errors, prefix, fieldErrorKeys) {
  const fieldNames = createDateFieldNames(prefix)
  const dayError = fieldErrorKeys[fieldNames.DAY]
  const monthError = fieldErrorKeys[fieldNames.MONTH]
  const yearError = fieldErrorKeys[fieldNames.YEAR]

  return errors[dayError] && errors[monthError] && errors[yearError]
}

function hasSpecificDateError(errorKeys, errorTypeMap, errorKey) {
  return errorKeys[errorKey] && errorTypeMap[errorKeys[errorKey]]
}

function hasFieldError(errors, errorKeys, field) {
  return errors[errorKeys[field]]
}

export function getDateErrorMessage({
  isDateMissing,
  errorTypeMap,
  errors,
  errorKeys,
  errorMessages
}) {
  if (isDateMissing) {
    return { text: errorMessages[errorKeys.MISSING] }
  }

  if (hasSpecificDateError(errorKeys, errorTypeMap, 'INVALID')) {
    return { text: errorMessages[errorKeys.INVALID] }
  }

  if (hasSpecificDateError(errorKeys, errorTypeMap, 'TODAY_OR_FUTURE')) {
    return { text: errorMessages[errorKeys.TODAY_OR_FUTURE] }
  }

  if (hasSpecificDateError(errorKeys, errorTypeMap, 'BEFORE_OTHER_DATE')) {
    return { text: errorMessages[errorKeys.BEFORE_OTHER_DATE] }
  }

  if (hasSpecificDateError(errorKeys, errorTypeMap, 'TOO_FAR_FUTURE')) {
    return { text: errorMessages[errorKeys.TOO_FAR_FUTURE] }
  }

  if (hasSpecificDateError(errorKeys, errorTypeMap, 'TOO_FAR_APART')) {
    return { text: errorMessages[errorKeys.TOO_FAR_APART] }
  }

  if (hasFieldError(errors, errorKeys, 'DAY')) {
    return { text: errorMessages[errorKeys.DAY] }
  }

  if (hasFieldError(errors, errorKeys, 'MONTH')) {
    return { text: errorMessages[errorKeys.MONTH] }
  }

  if (hasFieldError(errors, errorKeys, 'YEAR')) {
    return { text: errorMessages[errorKeys.YEAR] }
  }

  return null
}

export function generateDateErrorMessages({
  dateConfigs,
  errorDetails,
  errorMessages
}) {
  const dateErrorMessages = {}
  const errorTypeMap = createErrorTypeMap(errorDetails)

  const basicErrorSummary = errorDetails.map((detail) => ({
    href: detail.path?.[0] ? `#${detail.path[0]}` : '#',
    text: errorMessages[detail.type] || detail.message,
    field: detail.path
  }))

  const errors = basicErrorSummary.reduce((errorMap, errorObj) => {
    errorMap[errorObj.field] = errorObj
    return errorMap
  }, {})

  for (const config of dateConfigs) {
    const isDateMissing = isCompleteDateMissing(
      errors,
      config.prefix,
      config.fieldErrorKeys
    )

    const errorMessage = getDateErrorMessage({
      isDateMissing,
      errorTypeMap,
      errors,
      errorKeys: config.errorKeys,
      errorMessages
    })

    dateErrorMessages[config.errorMessageKey] = errorMessage
  }

  return dateErrorMessages
}
