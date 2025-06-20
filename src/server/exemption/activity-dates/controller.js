import Wreck from '@hapi/wreck'
import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { config } from '~/src/config/config.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'
import { activityDatesSchema } from '~/src/server/common/schemas/date.js'
import {
  createDateISO,
  extractDateComponents
} from '~/src/server/common/helpers/date-utils.js'

export const ACTIVITY_DATES_VIEW_ROUTE = 'exemption/activity-dates/index'

const FIELD_NAMES = {
  START_DATE_DAY: 'activity-start-date-day',
  START_DATE_MONTH: 'activity-start-date-month',
  START_DATE_YEAR: 'activity-start-date-year',
  END_DATE_DAY: 'activity-end-date-day',
  END_DATE_MONTH: 'activity-end-date-month',
  END_DATE_YEAR: 'activity-end-date-year'
}

const activityDatesViewSettings = {
  title: 'Activity dates',
  descriptionParagraphs: [
    "Enter the activity dates. Allow time for potential delays, like consents (for example, a river works licence) or bad weather. If you miss the dates, you'll need to restart the process.",
    "You can enter a start date from today and begin your activity as soon as you've sent your information."
  ],
  backLink: routes.TASK_LIST,
  cancelLink: routes.TASK_LIST
}

export const errorMessages = {
  [JOI_ERRORS.ACTIVITY_START_DATE_DAY]: 'The start date must include a day',
  [JOI_ERRORS.ACTIVITY_START_DATE_MONTH]: 'The start date must include a month',
  [JOI_ERRORS.ACTIVITY_START_DATE_YEAR]: 'The start date must include a year',
  [JOI_ERRORS.ACTIVITY_END_DATE_DAY]: 'The end date must include a day',
  [JOI_ERRORS.ACTIVITY_END_DATE_MONTH]: 'The end date must include a month',
  [JOI_ERRORS.ACTIVITY_END_DATE_YEAR]: 'The end date must include a year',
  [JOI_ERRORS.CUSTOM_START_DATE_MISSING]: 'Enter the start date',
  [JOI_ERRORS.CUSTOM_END_DATE_MISSING]: 'Enter the end date',
  [JOI_ERRORS.CUSTOM_START_DATE_INVALID]: 'The start date must be a real date',
  [JOI_ERRORS.CUSTOM_END_DATE_INVALID]: 'The end date must be a real date',
  [JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]:
    'The start date must be today or in the future',
  [JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]:
    'The end date must be today or in the future',
  [JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]:
    'The end date must be the same as or after the start date'
}

/**
 * Extracts date fields from payload for display
 * @param {object} payload - Form payload
 * @returns {object} Date field values
 */
export function extractDateFieldsFromPayload(payload) {
  return {
    activityStartDateDay: payload[FIELD_NAMES.START_DATE_DAY] || '',
    activityStartDateMonth: payload[FIELD_NAMES.START_DATE_MONTH] || '',
    activityStartDateYear: payload[FIELD_NAMES.START_DATE_YEAR] || '',
    activityEndDateDay: payload[FIELD_NAMES.END_DATE_DAY] || '',
    activityEndDateMonth: payload[FIELD_NAMES.END_DATE_MONTH] || '',
    activityEndDateYear: payload[FIELD_NAMES.END_DATE_YEAR] || ''
  }
}

/**
 * Creates base template data with date fields
 * @param {object} exemption - Exemption cache data
 * @param {object} payload - Optional form payload
 * @returns {object} Template data
 */
export function createTemplateData(exemption, payload = null) {
  let dateFields

  if (payload) {
    dateFields = extractDateFieldsFromPayload(payload)
  } else {
    const startDateComponents = extractDateComponents(
      exemption.activityDates?.start
    )
    const endDateComponents = extractDateComponents(
      exemption.activityDates?.end
    )

    dateFields = {
      activityStartDateDay: startDateComponents.day,
      activityStartDateMonth: startDateComponents.month,
      activityStartDateYear: startDateComponents.year,
      activityEndDateDay: endDateComponents.day,
      activityEndDateMonth: endDateComponents.month,
      activityEndDateYear: endDateComponents.year
    }
  }

  return {
    ...activityDatesViewSettings,
    projectName: exemption.projectName,
    ...dateFields
  }
}

/**
 * Creates error type mapping from JOI error details
 * @param {Array} errorDetails - JOI error details array
 * @returns {object} Error type mapping
 */
function createErrorTypeMap(errorDetails) {
  const errorTypeMap = {}
  errorDetails.forEach((detail) => {
    errorTypeMap[detail.type] = detail
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
 * @param {string} dateType - 'start' or 'end'
 * @returns {boolean}
 */
function isCompleteDateMissing(errors, dateType) {
  const dayError =
    dateType === 'start'
      ? JOI_ERRORS.ACTIVITY_START_DATE_DAY
      : JOI_ERRORS.ACTIVITY_END_DATE_DAY
  const monthError =
    dateType === 'start'
      ? JOI_ERRORS.ACTIVITY_START_DATE_MONTH
      : JOI_ERRORS.ACTIVITY_END_DATE_MONTH
  const yearError =
    dateType === 'start'
      ? JOI_ERRORS.ACTIVITY_START_DATE_YEAR
      : JOI_ERRORS.ACTIVITY_END_DATE_YEAR

  return errors[dayError] && errors[monthError] && errors[yearError]
}

/**
 * Adds custom validation errors to error summary
 * @param {Array} errorSummary - Current error summary array
 * @param {object} errorTypeMap - Error type mapping
 */
export function addCustomValidationErrors(errorSummary, errorTypeMap) {
  // Check for number.max errors that should be treated as invalid date errors
  const hasStartInvalidFieldErrors = hasNumberMaxErrorsForDate(
    'start',
    errorTypeMap
  )
  const hasEndInvalidFieldErrors = hasNumberMaxErrorsForDate(
    'end',
    errorTypeMap
  )

  // Start date custom errors - check for today/future first (higher priority)
  let startDateErrorAdded = false

  if (errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]) {
    errorSummary.push({
      href: `#${FIELD_NAMES.START_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]
    })
    startDateErrorAdded = true
  }

  // Add invalid date error if no today/future error was added AND we have either
  // a custom invalid error OR number.max errors for date fields
  if (
    !startDateErrorAdded &&
    (errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_INVALID] ||
      hasStartInvalidFieldErrors)
  ) {
    errorSummary.push({
      href: `#${FIELD_NAMES.START_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_INVALID]
    })
    startDateErrorAdded = true
  }

  // End date custom errors - check for today/future first (higher priority)
  let endDateErrorAdded = false

  if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]) {
    errorSummary.push({
      href: `#${FIELD_NAMES.END_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]
    })
    endDateErrorAdded = true
  }

  // Add invalid date error if no today/future error was added AND we have either
  // a custom invalid error OR number.max errors for date fields
  if (
    !endDateErrorAdded &&
    (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_INVALID] ||
      hasEndInvalidFieldErrors)
  ) {
    errorSummary.push({
      href: `#${FIELD_NAMES.END_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_INVALID]
    })
    endDateErrorAdded = true
  }

  // Date relationship error
  if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]) {
    errorSummary.push({
      href: `#${FIELD_NAMES.END_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]
    })
  }
}

/**
 * Handles missing complete date errors in summary
 * @param {Array} errorSummary - Current error summary array
 * @param {boolean} isStartMissing - Whether start date is completely missing
 * @param {boolean} isEndMissing - Whether end date is completely missing
 * @returns {Array} Modified error summary
 */
function handleMissingDateErrors(errorSummary, isStartMissing, isEndMissing) {
  let modifiedSummary = [...errorSummary]

  if (isStartMissing) {
    modifiedSummary = modifiedSummary.filter(
      (error) => !error.href.includes('#activity-start-date')
    )
    modifiedSummary.unshift({
      href: `#${FIELD_NAMES.START_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_MISSING]
    })
  }

  if (isEndMissing) {
    modifiedSummary = modifiedSummary.filter(
      (error) => !error.href.includes('#activity-end-date')
    )
    modifiedSummary.push({
      href: `#${FIELD_NAMES.END_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_MISSING]
    })
  }

  return modifiedSummary
}

/**
 * Checks if there are any number.max errors for date fields that should be treated as invalid date errors
 * @param {string} dateType - 'start' or 'end'
 * @param {object} errorTypeMap - Error type mapping
 * @returns {boolean} True if there are number.max errors for date fields
 */
function hasNumberMaxErrorsForDate(dateType, errorTypeMap) {
  const prefix =
    dateType === 'start' ? 'activity-start-date' : 'activity-end-date'
  const dayField = `${prefix}-day`
  const monthField = `${prefix}-month`

  // Check if any of the date field errors are caused by number.max validation
  const dayError = errorTypeMap[dayField]
  const monthError = errorTypeMap[monthField]

  return (
    (dayError && dayError.type === 'number.max') ||
    (monthError && monthError.type === 'number.max')
  )
}

/**
 * Generic error message resolver for date fields
 * @param {string} dateType - 'start' or 'end'
 * @param {boolean} isDateMissing - Whether date is completely missing
 * @param {object} errorTypeMap - Error type mapping
 * @param {object} errors - Error descriptions by field name
 * @returns {object|null} Error message object or null
 */
function getDateErrorMessage(dateType, isDateMissing, errorTypeMap, errors) {
  // Check if we have number.max errors that should be treated as invalid date errors
  const hasInvalidDateFieldErrors = hasNumberMaxErrorsForDate(
    dateType,
    errorTypeMap
  )

  const errorPriority =
    dateType === 'start'
      ? [
          {
            condition: isDateMissing,
            key: JOI_ERRORS.CUSTOM_START_DATE_MISSING
          },
          {
            condition:
              errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_INVALID] ||
              hasInvalidDateFieldErrors,
            key: JOI_ERRORS.CUSTOM_START_DATE_INVALID
          },
          {
            condition:
              errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE],
            key: JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE
          },
          {
            condition:
              errors[JOI_ERRORS.ACTIVITY_START_DATE_DAY] &&
              !hasInvalidDateFieldErrors,
            key: JOI_ERRORS.ACTIVITY_START_DATE_DAY
          },
          {
            condition:
              errors[JOI_ERRORS.ACTIVITY_START_DATE_MONTH] &&
              !hasInvalidDateFieldErrors,
            key: JOI_ERRORS.ACTIVITY_START_DATE_MONTH
          },
          {
            condition:
              errors[JOI_ERRORS.ACTIVITY_START_DATE_YEAR] &&
              !hasInvalidDateFieldErrors,
            key: JOI_ERRORS.ACTIVITY_START_DATE_YEAR
          }
        ]
      : [
          { condition: isDateMissing, key: JOI_ERRORS.CUSTOM_END_DATE_MISSING },
          {
            condition:
              errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_INVALID] ||
              hasInvalidDateFieldErrors,
            key: JOI_ERRORS.CUSTOM_END_DATE_INVALID
          },
          {
            condition:
              errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE],
            key: JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE
          },
          {
            condition: errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE],
            key: JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE
          },
          {
            condition:
              errors[JOI_ERRORS.ACTIVITY_END_DATE_DAY] &&
              !hasInvalidDateFieldErrors,
            key: JOI_ERRORS.ACTIVITY_END_DATE_DAY
          },
          {
            condition:
              errors[JOI_ERRORS.ACTIVITY_END_DATE_MONTH] &&
              !hasInvalidDateFieldErrors,
            key: JOI_ERRORS.ACTIVITY_END_DATE_MONTH
          },
          {
            condition:
              errors[JOI_ERRORS.ACTIVITY_END_DATE_YEAR] &&
              !hasInvalidDateFieldErrors,
            key: JOI_ERRORS.ACTIVITY_END_DATE_YEAR
          }
        ]

  const errorToShow = errorPriority.find((error) => error.condition)
  return errorToShow ? { text: errorMessages[errorToShow.key] } : null
}

/**
 * Determines the appropriate error message for start date
 * @param {boolean} isStartMissing - Whether start date is completely missing
 * @param {object} errorTypeMap - Error type mapping
 * @param {object} errors - Error descriptions by field name
 * @returns {object|null} Error message object or null
 */
function getStartDateErrorMessage(isStartMissing, errorTypeMap, errors) {
  return getDateErrorMessage('start', isStartMissing, errorTypeMap, errors)
}

/**
 * Determines the appropriate error message for end date
 * @param {boolean} isEndMissing - Whether end date is completely missing
 * @param {object} errorTypeMap - Error type mapping
 * @param {object} errors - Error descriptions by field name
 * @returns {object|null} Error message object or null
 */
function getEndDateErrorMessage(isEndMissing, errorTypeMap, errors) {
  return getDateErrorMessage('end', isEndMissing, errorTypeMap, errors)
}

/**
 * Activity dates GET controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const activityDatesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(ACTIVITY_DATES_VIEW_ROUTE, createTemplateData(exemption))
  }
}

/**
 * Processes validation errors and returns template data
 * @param {object} request - Hapi request object
 * @param {object} h - Hapi response toolkit
 * @param {Error} err - Validation error
 * @returns {object} Response with error template
 */
function handleValidationErrors(request, h, err) {
  const { payload } = request
  const exemption = getExemptionCache(request)

  if (!err.details) {
    return h
      .view(ACTIVITY_DATES_VIEW_ROUTE, createTemplateData(exemption, payload))
      .takeover()
  }

  const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
  const errors = errorDescriptionByFieldName(errorSummary)
  const errorTypeMap = createErrorTypeMap(err.details)

  const isStartMissing = isCompleteDateMissing(errors, 'start')
  const isEndMissing = isCompleteDateMissing(errors, 'end')

  let modifiedErrorSummary = errorSummary.filter(
    (error) => error.href && error.href !== '#' && error.href !== '#undefined'
  )

  addCustomValidationErrors(modifiedErrorSummary, errorTypeMap)
  modifiedErrorSummary = handleMissingDateErrors(
    modifiedErrorSummary,
    isStartMissing,
    isEndMissing
  )

  const startDateErrorMessage = getStartDateErrorMessage(
    isStartMissing,
    errorTypeMap,
    errors
  )
  const endDateErrorMessage = getEndDateErrorMessage(
    isEndMissing,
    errorTypeMap,
    errors
  )

  return h
    .view(ACTIVITY_DATES_VIEW_ROUTE, {
      ...createTemplateData(exemption, payload),
      errors,
      errorSummary: modifiedErrorSummary,
      startDateErrorMessage,
      endDateErrorMessage
    })
    .takeover()
}

/**
 * Activity dates POST controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const activityDatesSubmitController = {
  options: {
    validate: {
      payload: activityDatesSchema,
      failAction: handleValidationErrors
    }
  },
  async handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)

    try {
      const start = createDateISO(
        payload[FIELD_NAMES.START_DATE_YEAR],
        payload[FIELD_NAMES.START_DATE_MONTH],
        payload[FIELD_NAMES.START_DATE_DAY]
      )

      const end = createDateISO(
        payload[FIELD_NAMES.END_DATE_YEAR],
        payload[FIELD_NAMES.END_DATE_MONTH],
        payload[FIELD_NAMES.END_DATE_DAY]
      )

      await Wreck.patch(
        `${config.get('backend').apiUrl}/exemption/activity-dates`,
        {
          payload: {
            id: exemption.id,
            start,
            end
          },
          json: true
        }
      )

      setExemptionCache(request, {
        ...exemption,
        activityDates: {
          start,
          end
        }
      })

      return h.redirect(routes.TASK_LIST)
    } catch (e) {
      const { details } = e.data?.payload?.validation ?? {}

      if (!details) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)
      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(ACTIVITY_DATES_VIEW_ROUTE, {
        ...createTemplateData(exemption, payload),
        errors,
        errorSummary
      })
    }
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
