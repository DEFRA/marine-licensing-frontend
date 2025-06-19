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

        const errorTypeMap = {}
        err.details.forEach((detail) => {
          errorTypeMap[detail.type] = detail
        })

        // Check if all three date components are missing to consolidate error messages
        const isStartMissing =
          errors[JOI_ERRORS.ACTIVITY_START_DATE_DAY] &&
          errors[JOI_ERRORS.ACTIVITY_START_DATE_MONTH] &&
          errors[JOI_ERRORS.ACTIVITY_START_DATE_YEAR]

        const isEndMissing =
          errors[JOI_ERRORS.ACTIVITY_END_DATE_DAY] &&
          errors[JOI_ERRORS.ACTIVITY_END_DATE_MONTH] &&
          errors[JOI_ERRORS.ACTIVITY_END_DATE_YEAR]

        let modifiedErrorSummary = errorSummary.filter(
          (error) =>
            error.href && error.href !== '#' && error.href !== '#undefined'
        )
        let startDateErrorMessage = null
        let endDateErrorMessage = null

        // Prioritize specific error messages over generic ones
        if (errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]) {
          modifiedErrorSummary.push({
            href: '#activity-start-date-day',
            text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]
          })
        } else if (errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_INVALID]) {
          modifiedErrorSummary.push({
            href: '#activity-start-date-day',
            text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_INVALID]
          })
        }

        if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]) {
          modifiedErrorSummary.push({
            href: '#activity-end-date-day',
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]
          })
        } else if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_INVALID]) {
          modifiedErrorSummary.push({
            href: '#activity-end-date-day',
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_INVALID]
          })
        }

        if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]) {
          modifiedErrorSummary.push({
            href: '#activity-end-date-day',
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]
          })
        }

        if (isStartMissing) {
          modifiedErrorSummary = modifiedErrorSummary.filter(
            (error) => !error.href.includes('#activity-start-date')
          )
          modifiedErrorSummary.unshift({
            href: '#activity-start-date-day',
            text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_MISSING]
          })
          startDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_MISSING]
          }
        } else if (errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]) {
          startDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]
          }
        } else if (errorTypeMap[JOI_ERRORS.CUSTOM_START_DATE_INVALID]) {
          startDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_INVALID]
          }
        } else if (errors[JOI_ERRORS.ACTIVITY_START_DATE_DAY]) {
          startDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.ACTIVITY_START_DATE_DAY]
          }
        } else if (errors[JOI_ERRORS.ACTIVITY_START_DATE_MONTH]) {
          startDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.ACTIVITY_START_DATE_MONTH]
          }
        } else if (errors[JOI_ERRORS.ACTIVITY_START_DATE_YEAR]) {
          startDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.ACTIVITY_START_DATE_YEAR]
          }
        }

        if (isEndMissing) {
          modifiedErrorSummary = modifiedErrorSummary.filter(
            (error) => !error.href.includes('#activity-end-date')
          )
          modifiedErrorSummary.push({
            href: '#activity-end-date-day',
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_MISSING]
          })
          endDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_MISSING]
          }
        } else if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]) {
          endDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]
          }
        } else if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_INVALID]) {
          endDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_INVALID]
          }
        } else if (errorTypeMap[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]) {
          endDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]
          }
        } else if (errors[JOI_ERRORS.ACTIVITY_END_DATE_DAY]) {
          endDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.ACTIVITY_END_DATE_DAY]
          }
        } else if (errors[JOI_ERRORS.ACTIVITY_END_DATE_MONTH]) {
          endDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.ACTIVITY_END_DATE_MONTH]
          }
        } else if (errors[JOI_ERRORS.ACTIVITY_END_DATE_YEAR]) {
          endDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.ACTIVITY_END_DATE_YEAR]
          }
        }

        return h
          .view(ACTIVITY_DATES_VIEW_ROUTE, {
            ...activityDatesViewSettings,
            projectName: exemption.projectName,
            activityStartDateDay: payload['activity-start-date-day'] || '',
            activityStartDateMonth: payload['activity-start-date-month'] || '',
            activityStartDateYear: payload['activity-start-date-year'] || '',
            activityEndDateDay: payload['activity-end-date-day'] || '',
            activityEndDateMonth: payload['activity-end-date-month'] || '',
            activityEndDateYear: payload['activity-end-date-year'] || '',
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
        payload['activity-start-date-year'],
        payload['activity-start-date-month'],
        payload['activity-start-date-day']
      )

      const end = createDateISO(
        payload['activity-end-date-year'],
        payload['activity-end-date-month'],
        payload['activity-end-date-day']
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
        activityStartDateDay: payload['activity-start-date-day'] || '',
        activityStartDateMonth: payload['activity-start-date-month'] || '',
        activityStartDateYear: payload['activity-start-date-year'] || '',
        activityEndDateDay: payload['activity-end-date-day'] || '',
        activityEndDateMonth: payload['activity-end-date-month'] || '',
        activityEndDateYear: payload['activity-end-date-year'] || '',
        errors,
        errorSummary
      })
    }
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
