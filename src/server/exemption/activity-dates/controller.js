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
import { createDateISO } from '~/src/server/common/helpers/date-utils.js'
import {
  createDateFieldNames,
  extractMultipleDateFields,
  createDateFieldsFromValue,
  handleDateValidationErrors,
  addCustomValidationErrors as genericAddCustomValidationErrors
} from '~/src/server/common/helpers/date-form-utils.js'

export const ACTIVITY_DATES_VIEW_ROUTE = 'exemption/activity-dates/index'

// Date field prefix constants
const ACTIVITY_START_DATE_PREFIX = 'activity-start-date'
const ACTIVITY_END_DATE_PREFIX = 'activity-end-date'

const START_DATE_FIELD_NAMES = createDateFieldNames(ACTIVITY_START_DATE_PREFIX)
const END_DATE_FIELD_NAMES = createDateFieldNames(ACTIVITY_END_DATE_PREFIX)

const FIELD_NAMES = {
  START_DATE_DAY: START_DATE_FIELD_NAMES.DAY,
  START_DATE_MONTH: START_DATE_FIELD_NAMES.MONTH,
  START_DATE_YEAR: START_DATE_FIELD_NAMES.YEAR,
  END_DATE_DAY: END_DATE_FIELD_NAMES.DAY,
  END_DATE_MONTH: END_DATE_FIELD_NAMES.MONTH,
  END_DATE_YEAR: END_DATE_FIELD_NAMES.YEAR
}

const activityDatesViewSettings = {
  title: 'Activity dates',
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
  const dateConfigs = [
    { key: 'activityStartDate', prefix: ACTIVITY_START_DATE_PREFIX },
    { key: 'activityEndDate', prefix: ACTIVITY_END_DATE_PREFIX }
  ]

  return extractMultipleDateFields(payload, dateConfigs)
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
    const startDateFields = createDateFieldsFromValue(
      exemption.activityDates?.start
    )
    const endDateFields = createDateFieldsFromValue(
      exemption.activityDates?.end
    )

    dateFields = {
      activityStartDateDay: startDateFields.day,
      activityStartDateMonth: startDateFields.month,
      activityStartDateYear: startDateFields.year,
      activityEndDateDay: endDateFields.day,
      activityEndDateMonth: endDateFields.month,
      activityEndDateYear: endDateFields.year
    }
  }

  return {
    ...activityDatesViewSettings,
    projectName: exemption.projectName,
    ...dateFields
  }
}

// Date configuration for the generic date form utilities
const DATE_CONFIGS = [
  {
    prefix: ACTIVITY_START_DATE_PREFIX,
    fieldNames: START_DATE_FIELD_NAMES,
    errorMessageKey: 'startDateErrorMessage',
    errorKeys: {
      MISSING: JOI_ERRORS.CUSTOM_START_DATE_MISSING,
      INVALID: JOI_ERRORS.CUSTOM_START_DATE_INVALID,
      TODAY_OR_FUTURE: JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE,
      DAY: JOI_ERRORS.ACTIVITY_START_DATE_DAY,
      MONTH: JOI_ERRORS.ACTIVITY_START_DATE_MONTH,
      YEAR: JOI_ERRORS.ACTIVITY_START_DATE_YEAR
    },
    fieldErrorKeys: {
      [START_DATE_FIELD_NAMES.DAY]: JOI_ERRORS.ACTIVITY_START_DATE_DAY,
      [START_DATE_FIELD_NAMES.MONTH]: JOI_ERRORS.ACTIVITY_START_DATE_MONTH,
      [START_DATE_FIELD_NAMES.YEAR]: JOI_ERRORS.ACTIVITY_START_DATE_YEAR
    },
    errorMessages
  },
  {
    prefix: ACTIVITY_END_DATE_PREFIX,
    fieldNames: END_DATE_FIELD_NAMES,
    errorMessageKey: 'endDateErrorMessage',
    errorKeys: {
      MISSING: JOI_ERRORS.CUSTOM_END_DATE_MISSING,
      INVALID: JOI_ERRORS.CUSTOM_END_DATE_INVALID,
      TODAY_OR_FUTURE: JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE,
      BEFORE_OTHER_DATE: JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE,
      DAY: JOI_ERRORS.ACTIVITY_END_DATE_DAY,
      MONTH: JOI_ERRORS.ACTIVITY_END_DATE_MONTH,
      YEAR: JOI_ERRORS.ACTIVITY_END_DATE_YEAR
    },
    fieldErrorKeys: {
      [END_DATE_FIELD_NAMES.DAY]: JOI_ERRORS.ACTIVITY_END_DATE_DAY,
      [END_DATE_FIELD_NAMES.MONTH]: JOI_ERRORS.ACTIVITY_END_DATE_MONTH,
      [END_DATE_FIELD_NAMES.YEAR]: JOI_ERRORS.ACTIVITY_END_DATE_YEAR
    },
    errorMessages
  }
]

/**
 * Backwards compatibility wrapper for addCustomValidationErrors
 * @param {Array} errorSummary - Current error summary array
 * @param {object} errorTypeMap - Error type mapping
 */
export function addCustomValidationErrors(errorSummary, errorTypeMap) {
  return genericAddCustomValidationErrors(
    errorSummary,
    errorTypeMap,
    DATE_CONFIGS
  )
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
  const exemption = getExemptionCache(request)

  return handleDateValidationErrors({
    request,
    h,
    err,
    dateConfigs: DATE_CONFIGS,
    errorMessages,
    createTemplateData: (payload) => createTemplateData(exemption, payload),
    viewRoute: ACTIVITY_DATES_VIEW_ROUTE
  })
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
