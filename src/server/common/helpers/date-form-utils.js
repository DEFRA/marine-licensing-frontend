/**
 * Generic Date Form Utilities
 *
 * This module provides reusable utilities for handling date forms with multiple
 * date fields (day, month, year components). It's designed to work with any
 * date field prefix and can handle multiple dates within the same form.
 *
 * USAGE EXAMPLE:
 *
 * 1. Define your date configurations:
 * ```javascript
 * const dateConfigs = [
 *   {
 *     prefix: 'birth-date',
 *     fieldNames: createDateFieldNames('birth-date'),
 *     errorMessageKey: 'birthDateErrorMessage',
 *     errorKeys: {
 *       MISSING: 'CUSTOM_BIRTH_DATE_MISSING',
 *       INVALID: 'CUSTOM_BIRTH_DATE_INVALID',
 *       TODAY_OR_FUTURE: 'CUSTOM_BIRTH_DATE_TODAY_OR_FUTURE',
 *       DAY: 'BIRTH_DATE_DAY',
 *       MONTH: 'BIRTH_DATE_MONTH',
 *       YEAR: 'BIRTH_DATE_YEAR'
 *     },
 *     fieldErrorKeys: {
 *       'birth-date-day': 'BIRTH_DATE_DAY',
 *       'birth-date-month': 'BIRTH_DATE_MONTH',
 *       'birth-date-year': 'BIRTH_DATE_YEAR'
 *     },
 *     errorMessages: {
 *       'CUSTOM_BIRTH_DATE_MISSING': 'Enter your birth date',
 *       'CUSTOM_BIRTH_DATE_INVALID': 'Birth date must be a real date',
 *       // ... other error messages
 *     }
 *   }
 * ]
 * ```
 *
 * 2. Use in your controller:
 * ```javascript
 * import { handleDateValidationErrors, extractMultipleDateFields } from '~/src/server/common/helpers/date-form-utils.js'
 *
 * export function handlePost(request, h) {
 *   // Extract date fields from payload
 *   const dateFields = extractMultipleDateFields(request.payload, [
 *     { key: 'birthDate', prefix: 'birth-date' }
 *   ])
 *
 *   // Handle validation errors
 *   const failAction = (request, h, err) => {
 *     return handleDateValidationErrors({
 *       request,
 *       h,
 *       err,
 *       dateConfigs,
 *       errorMessages,
 *       createTemplateData: (payload) => ({ ...dateFields }),
 *       viewRoute: 'your/view/route'
 *     })
 *   }
 * }
 * ```
 *
 * FEATURES:
 * - Generic field name generation for any date prefix
 * - Automatic error message priority handling
 * - Support for multiple dates in the same form
 * - Custom validation error handling (missing dates, invalid dates, etc.)
 * - Template data extraction and preparation
 * - Backwards compatibility with existing implementations
 */

import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { extractDateComponents } from '~/src/server/common/helpers/date-utils.js'

/**
 * Creates field names for a date with given prefix
 * @param {string} prefix - Field prefix (e.g., 'activity-start-date')
 * @returns {object} Field names object
 */
export function createDateFieldNames(prefix) {
  return {
    DAY: `${prefix}-day`,
    MONTH: `${prefix}-month`,
    YEAR: `${prefix}-year`
  }
}

/**
 * Extracts date fields from payload for a specific date prefix
 * @param {object} payload - Form payload
 * @param {string} prefix - Date field prefix
 * @returns {object} Date field values
 */
export function extractDateFieldsFromPayload(payload, prefix) {
  const fieldNames = createDateFieldNames(prefix)
  return {
    day: payload[fieldNames.DAY] || '',
    month: payload[fieldNames.MONTH] || '',
    year: payload[fieldNames.YEAR] || ''
  }
}

/**
 * Extracts multiple date fields from payload
 * @param {object} payload - Form payload
 * @param {Array<{key: string, prefix: string}>} dateConfigs - Array of date configurations
 * @returns {object} All date field values
 */
export function extractMultipleDateFields(payload, dateConfigs) {
  const result = {}
  dateConfigs.forEach(({ key, prefix }) => {
    const dateFields = extractDateFieldsFromPayload(payload, prefix)
    result[`${key}Day`] = dateFields.day
    result[`${key}Month`] = dateFields.month
    result[`${key}Year`] = dateFields.year
  })
  return result
}

/**
 * Creates date field values from existing date data
 * @param {string|null} dateValue - ISO date string or null
 * @returns {object} Date field components
 */
export function createDateFieldsFromValue(dateValue) {
  const components = extractDateComponents(dateValue)
  return {
    day: components.day,
    month: components.month,
    year: components.year
  }
}

/**
 * Creates error type mapping from JOI error details
 * @param {Array} errorDetails - JOI error details array
 * @returns {object} Error type mapping
 */
export function createErrorTypeMap(errorDetails) {
  const errorTypeMap = {}
  errorDetails.forEach((detail) => {
    errorTypeMap[detail.type] = detail
    // Also map by path for field-specific errors
    if (detail.path && detail.path.length > 0) {
      errorTypeMap[detail.path[0]] = detail
    }
    // Also map by message for custom error types
    if (detail.message !== detail.type) {
      errorTypeMap[detail.message] = detail
    }
  })
  return errorTypeMap
}

/**
 * Checks if all date components are missing for complete date validation
 * @param {object} errors - Error descriptions by field name
 * @param {string} prefix - Date field prefix
 * @param {object} fieldErrorKeys - Field error key mapping
 * @returns {boolean}
 */
export function isCompleteDateMissing(errors, prefix, fieldErrorKeys) {
  const fieldNames = createDateFieldNames(prefix)
  const dayError = fieldErrorKeys[fieldNames.DAY]
  const monthError = fieldErrorKeys[fieldNames.MONTH]
  const yearError = fieldErrorKeys[fieldNames.YEAR]

  return errors[dayError] && errors[monthError] && errors[yearError]
}

/**
 * Checks if there are any number.max errors for date fields that should be treated as invalid date errors
 * @param {string} prefix - Date field prefix (e.g., 'activity-start-date')
 * @param {object} errorTypeMap - Error type mapping
 * @returns {boolean} True if there are number.max errors for date fields
 */
export function hasNumberMaxErrorsForDate(prefix, errorTypeMap) {
  const fieldNames = createDateFieldNames(prefix)

  // Check if any of the date field errors are caused by number.max validation
  const dayError = errorTypeMap[fieldNames.DAY]
  const monthError = errorTypeMap[fieldNames.MONTH]

  return (
    (dayError && dayError.type === 'number.max') ||
    (monthError && monthError.type === 'number.max')
  )
}

/**
 * Generic error message resolver for date fields
 * @param {object} config - Configuration object
 * @param {string} config.prefix - Date field prefix
 * @param {boolean} config.isDateMissing - Whether date is completely missing
 * @param {object} config.errorTypeMap - Error type mapping
 * @param {object} config.errors - Error descriptions by field name
 * @param {object} config.errorKeys - Error key mapping for this date type
 * @param {object} config.errorMessages - Error message mapping
 * @returns {object|null} Error message object or null
 */
export function getDateErrorMessage({
  prefix,
  isDateMissing,
  errorTypeMap,
  errors,
  errorKeys,
  errorMessages
}) {
  // Check if we have number.max errors that should be treated as invalid date errors
  const hasInvalidDateFieldErrors = hasNumberMaxErrorsForDate(
    prefix,
    errorTypeMap
  )

  const errorPriority = [
    {
      condition: isDateMissing,
      key: errorKeys.MISSING
    },
    {
      condition: errorTypeMap[errorKeys.INVALID] || hasInvalidDateFieldErrors,
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
      condition: errors[errorKeys.DAY] && !hasInvalidDateFieldErrors,
      key: errorKeys.DAY
    },
    {
      condition: errors[errorKeys.MONTH] && !hasInvalidDateFieldErrors,
      key: errorKeys.MONTH
    },
    {
      condition: errors[errorKeys.YEAR] && !hasInvalidDateFieldErrors,
      key: errorKeys.YEAR
    }
  ].filter((error) => error.key) // Filter out undefined keys

  const errorToShow = errorPriority.find((error) => error.condition)
  return errorToShow ? { text: errorMessages[errorToShow.key] } : null
}

/**
 * Adds custom validation errors to error summary for multiple dates
 * @param {Array} errorSummary - Current error summary array
 * @param {object} errorTypeMap - Error type mapping
 * @param {Array} dateConfigs - Array of date configurations
 */
export function addCustomValidationErrors(
  errorSummary,
  errorTypeMap,
  dateConfigs
) {
  dateConfigs.forEach(({ prefix, errorKeys, errorMessages }) => {
    // Check for number.max errors that should be treated as invalid date errors
    const hasInvalidFieldErrors = hasNumberMaxErrorsForDate(
      prefix,
      errorTypeMap
    )
    const dateFieldNames = createDateFieldNames(prefix)

    let dateErrorAdded = false

    // Check for today/future error first (higher priority)
    if (errorKeys.TODAY_OR_FUTURE && errorTypeMap[errorKeys.TODAY_OR_FUTURE]) {
      errorSummary.push({
        href: `#${dateFieldNames.DAY}`,
        text: errorMessages[errorKeys.TODAY_OR_FUTURE]
      })
      dateErrorAdded = true
    }

    // Add invalid date error if no today/future error was added AND we have either
    // a custom invalid error OR number.max errors for date fields
    if (
      !dateErrorAdded &&
      errorKeys.INVALID &&
      (errorTypeMap[errorKeys.INVALID] || hasInvalidFieldErrors)
    ) {
      errorSummary.push({
        href: `#${dateFieldNames.DAY}`,
        text: errorMessages[errorKeys.INVALID]
      })
    }

    // Date relationship error (e.g., end before start)
    if (
      errorKeys.BEFORE_OTHER_DATE &&
      errorTypeMap[errorKeys.BEFORE_OTHER_DATE]
    ) {
      errorSummary.push({
        href: `#${dateFieldNames.DAY}`,
        text: errorMessages[errorKeys.BEFORE_OTHER_DATE]
      })
    }
  })
}

/**
 * Handles missing complete date errors in summary
 * @param {Array} errorSummary - Current error summary array
 * @param {Array} missingDates - Array of missing date configurations
 * @returns {Array} Modified error summary
 */
export function handleMissingDateErrors(errorSummary, missingDates) {
  let modifiedSummary = [...errorSummary]

  missingDates.forEach(({ prefix, errorKey, errorMessage, fieldNames }) => {
    // Remove existing errors for this date
    modifiedSummary = modifiedSummary.filter(
      (error) => !error.href.includes(`#${prefix}`)
    )

    // Add the missing date error
    const position = errorKey.includes('START') ? 'unshift' : 'push'
    modifiedSummary[position]({
      href: `#${fieldNames.DAY}`,
      text: errorMessage
    })
  })

  return modifiedSummary
}

/**
 * Processes validation errors for date forms
 * @param {object} config - Configuration object
 * @param {object} config.request - Hapi request object
 * @param {object} config.h - Hapi response toolkit
 * @param {Error} config.err - Validation error
 * @param {Array} config.dateConfigs - Array of date configurations
 * @param {object} config.errorMessages - Error message mapping
 * @param {Function} config.createTemplateData - Function to create template data
 * @param {string} config.viewRoute - View route for rendering
 * @returns {object} Response with error template
 */
export function handleDateValidationErrors({
  request,
  h,
  err,
  dateConfigs,
  errorMessages,
  createTemplateData,
  viewRoute
}) {
  const { payload } = request

  if (!err.details) {
    return h.view(viewRoute, createTemplateData(payload)).takeover()
  }

  const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
  const errors = errorDescriptionByFieldName(errorSummary)
  const errorTypeMap = createErrorTypeMap(err.details)

  // Check for missing dates
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
        errorMessage: errorMessages[config.errorKeys.MISSING],
        fieldNames: config.fieldNames
      })
    }
  })

  let modifiedErrorSummary = errorSummary.filter(
    (error) => error.href && error.href !== '#' && error.href !== '#undefined'
  )

  addCustomValidationErrors(modifiedErrorSummary, errorTypeMap, dateConfigs)
  modifiedErrorSummary = handleMissingDateErrors(
    modifiedErrorSummary,
    missingDates
  )

  // Generate error messages for each date
  const dateErrorMessages = {}
  dateConfigs.forEach((config) => {
    const isDateMissing = missingDates.some(
      (missing) => missing.prefix === config.prefix
    )
    const errorMessage = getDateErrorMessage({
      prefix: config.prefix,
      isDateMissing,
      errorTypeMap,
      errors,
      errorKeys: config.errorKeys,
      errorMessages
    })
    dateErrorMessages[config.errorMessageKey] = errorMessage
  })

  return h
    .view(viewRoute, {
      ...createTemplateData(payload),
      errors,
      errorSummary: modifiedErrorSummary,
      ...dateErrorMessages
    })
    .takeover()
}
