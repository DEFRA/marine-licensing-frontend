import {
  ACTIVITY_DATE_FIELD_NAMES,
  ACTIVITY_DATES_CONFIG,
  ACTIVITY_DATES_ERROR_MESSAGES,
  ACTIVITY_DATES_VIEW_ROUTE,
  ACTIVITY_DATES_VIEW_SETTINGS,
  DATE_EXTRACTION_CONFIG
} from '~/src/server/common/constants/activity-dates.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { processDateValidationErrors } from '~/src/server/common/helpers/dates/date-form-utils.js'
import {
  createDateFieldsFromValue,
  createDateISO,
  extractMultipleDateFields
} from '~/src/server/common/helpers/dates/date-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { activityDatesSchema } from '~/src/server/common/schemas/date.js'

function createTemplateData(exemption, payload = null) {
  let dateFields

  if (payload) {
    dateFields = extractMultipleDateFields(payload, DATE_EXTRACTION_CONFIG)
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
    ...ACTIVITY_DATES_VIEW_SETTINGS,
    projectName: exemption.projectName,
    ...dateFields
  }
}

export const activityDatesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    return h.view(ACTIVITY_DATES_VIEW_ROUTE, createTemplateData(exemption))
  }
}

function handleValidationErrors(request, h, err) {
  const exemption = getExemptionCache(request)
  const { payload } = request

  const validationResult = processDateValidationErrors(
    err,
    ACTIVITY_DATES_CONFIG,
    ACTIVITY_DATES_ERROR_MESSAGES
  )

  if (!validationResult) {
    return h
      .view(ACTIVITY_DATES_VIEW_ROUTE, createTemplateData(exemption, payload))
      .takeover()
  }

  return h
    .view(ACTIVITY_DATES_VIEW_ROUTE, {
      ...createTemplateData(exemption, payload),
      ...validationResult
    })
    .takeover()
}

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
        payload[ACTIVITY_DATE_FIELD_NAMES.START_DATE_YEAR],
        payload[ACTIVITY_DATE_FIELD_NAMES.START_DATE_MONTH],
        payload[ACTIVITY_DATE_FIELD_NAMES.START_DATE_DAY]
      )

      const end = createDateISO(
        payload[ACTIVITY_DATE_FIELD_NAMES.END_DATE_YEAR],
        payload[ACTIVITY_DATE_FIELD_NAMES.END_DATE_MONTH],
        payload[ACTIVITY_DATE_FIELD_NAMES.END_DATE_DAY]
      )

      await authenticatedPatchRequest(request, '/exemption/activity-dates', {
        id: exemption.id,
        start,
        end
      })

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

      const errorSummary = mapErrorsForDisplay(
        details,
        ACTIVITY_DATES_ERROR_MESSAGES
      )
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
