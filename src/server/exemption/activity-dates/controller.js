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
  backLink: routes.TASK_LIST
}

const errorMessages = {
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
 * Creates a date from individual components and returns ISO string
 * @param {string|number} year
 * @param {string|number} month
 * @param {string|number} day
 * @returns {string|null}
 */
function createDateISO(year, month, day) {
  const numYear = parseInt(year, 10)
  const numMonth = parseInt(month, 10)
  const numDay = parseInt(day, 10)

  if (isNaN(numYear) || isNaN(numMonth) || isNaN(numDay)) {
    return null
  }

  const date = new Date(Date.UTC(numYear, numMonth - 1, numDay))
  return date.toISOString()
}

/**
 * Creates error type mapping from JOI error details
 * @param {Array} errorDetails - JOI error details array
 * @returns {Object} Error type mapping
 */
function createErrorTypeMap(errorDetails) {
  const errorTypeMap = {}
  errorDetails.forEach((detail) => {
    errorTypeMap[detail.type] = detail
  })
  return errorTypeMap
}

/**
 * Checks if all date components are missing for complete date validation
 * @param {Object} errors - Error descriptions by field name
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
 * @param {Object} errorTypeMap - Error type mapping
 */
function addCustomValidationErrors(errorSummary, errorTypeMap) {
  // Start date custom errors
  if (errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]) {
    errorSummary.push({
      href: `#${FIELD_NAMES.START_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]
    })
  } else if (errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_INVALID]) {
    errorSummary.push({
      href: `#${FIELD_NAMES.START_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_INVALID]
    })
  }

  // End date custom errors
  if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]) {
    errorSummary.push({
      href: `#${FIELD_NAMES.END_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]
    })
  } else if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_INVALID]) {
    errorSummary.push({
      href: `#${FIELD_NAMES.END_DATE_DAY}`,
      text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_INVALID]
    })
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
 * Determines the appropriate error message for start date
 * @param {boolean} isStartMissing - Whether start date is completely missing
 * @param {Object} errorTypeMap - Error type mapping
 * @param {Object} errors - Error descriptions by field name
 * @returns {Object|null} Error message object or null
 */
function getStartDateErrorMessage(isStartMissing, errorTypeMap, errors) {
  if (isStartMissing) {
    return { text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_MISSING] }
  }

  if (errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]) {
    return { text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE] }
  }

  if (errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_INVALID]) {
    return { text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_INVALID] }
  }

  if (errors[JOI_ERRORS.ACTIVITY_START_DATE_DAY]) {
    return { text: errorMessages[JOI_ERRORS.ACTIVITY_START_DATE_DAY] }
  }

  if (errors[JOI_ERRORS.ACTIVITY_START_DATE_MONTH]) {
    return { text: errorMessages[JOI_ERRORS.ACTIVITY_START_DATE_MONTH] }
  }

  if (errors[JOI_ERRORS.ACTIVITY_START_DATE_YEAR]) {
    return { text: errorMessages[JOI_ERRORS.ACTIVITY_START_DATE_YEAR] }
  }

  return null
}

/**
 * Determines the appropriate error message for end date
 * @param {boolean} isEndMissing - Whether end date is completely missing
 * @param {Object} errorTypeMap - Error type mapping
 * @param {Object} errors - Error descriptions by field name
 * @returns {Object|null} Error message object or null
 */
function getEndDateErrorMessage(isEndMissing, errorTypeMap, errors) {
  if (isEndMissing) {
    return { text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_MISSING] }
  }

  if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]) {
    return { text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE] }
  }

  if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_INVALID]) {
    return { text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_INVALID] }
  }

  if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]) {
    return { text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE] }
  }

  if (errors[JOI_ERRORS.ACTIVITY_END_DATE_DAY]) {
    return { text: errorMessages[JOI_ERRORS.ACTIVITY_END_DATE_DAY] }
  }

  if (errors[JOI_ERRORS.ACTIVITY_END_DATE_MONTH]) {
    return { text: errorMessages[JOI_ERRORS.ACTIVITY_END_DATE_MONTH] }
  }

  if (errors[JOI_ERRORS.ACTIVITY_END_DATE_YEAR]) {
    return { text: errorMessages[JOI_ERRORS.ACTIVITY_END_DATE_YEAR] }
  }

  return null
}

/**
 * Activity dates GET controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const activityDatesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    let activityStartDateDay = ''
    let activityStartDateMonth = ''
    let activityStartDateYear = ''
    let activityEndDateDay = ''
    let activityEndDateMonth = ''
    let activityEndDateYear = ''

    if (exemption.activityDates?.start) {
      const startDate = new Date(exemption.activityDates.start)
      activityStartDateDay = startDate.getUTCDate().toString()
      activityStartDateMonth = (startDate.getUTCMonth() + 1).toString()
      activityStartDateYear = startDate.getUTCFullYear().toString()
    }

    if (exemption.activityDates?.end) {
      const endDate = new Date(exemption.activityDates.end)
      activityEndDateDay = endDate.getUTCDate().toString()
      activityEndDateMonth = (endDate.getUTCMonth() + 1).toString()
      activityEndDateYear = endDate.getUTCFullYear().toString()
    }

    return h.view(ACTIVITY_DATES_VIEW_ROUTE, {
      ...activityDatesViewSettings,
      projectName: exemption.projectName,
      activityStartDateDay,
      activityStartDateMonth,
      activityStartDateYear,
      activityEndDateDay,
      activityEndDateMonth,
      activityEndDateYear
    })
  }
}

/**
 * Activity dates POST controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const activityDatesSubmitController = {
  options: {
    validate: {
      payload: activityDatesSchema,
      failAction: (request, h, err) => {
        const { payload } = request
        const exemption = getExemptionCache(request)

        if (!err.details) {
          return h
            .view(ACTIVITY_DATES_VIEW_ROUTE, {
              ...activityDatesViewSettings,
              projectName: exemption.projectName,
              payload
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)
        const errorTypeMap = createErrorTypeMap(err.details)

        const isStartMissing = isCompleteDateMissing(errors, 'start')
        const isEndMissing = isCompleteDateMissing(errors, 'end')

        let modifiedErrorSummary = errorSummary.filter(
          (error) =>
            error.href && error.href !== '#' && error.href !== '#undefined'
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
            ...activityDatesViewSettings,
            projectName: exemption.projectName,
            activityStartDateDay: payload[FIELD_NAMES.START_DATE_DAY] || '',
            activityStartDateMonth: payload[FIELD_NAMES.START_DATE_MONTH] || '',
            activityStartDateYear: payload[FIELD_NAMES.START_DATE_YEAR] || '',
            activityEndDateDay: payload[FIELD_NAMES.END_DATE_DAY] || '',
            activityEndDateMonth: payload[FIELD_NAMES.END_DATE_MONTH] || '',
            activityEndDateYear: payload[FIELD_NAMES.END_DATE_YEAR] || '',
            errors,
            errorSummary: modifiedErrorSummary,
            startDateErrorMessage,
            endDateErrorMessage
          })
          .takeover()
      }
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
        ...activityDatesViewSettings,
        projectName: exemption.projectName,
        activityStartDateDay: payload[FIELD_NAMES.START_DATE_DAY] || '',
        activityStartDateMonth: payload[FIELD_NAMES.START_DATE_MONTH] || '',
        activityStartDateYear: payload[FIELD_NAMES.START_DATE_YEAR] || '',
        activityEndDateDay: payload[FIELD_NAMES.END_DATE_DAY] || '',
        activityEndDateMonth: payload[FIELD_NAMES.END_DATE_MONTH] || '',
        activityEndDateYear: payload[FIELD_NAMES.END_DATE_YEAR] || '',
        errors,
        errorSummary
      })
    }
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
