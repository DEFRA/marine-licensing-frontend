import Wreck from '@hapi/wreck'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { config } from '~/src/config/config.js'
import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { JOI_ERRORS } from '~/src/server/common/constants/joi.js'
import { activityStartEndDateSchema } from '~/src/server/common/schemas/date.js'

function createDateFromInput(year, month, day) {
  const numYear = parseInt(year, 10)
  const numMonth = parseInt(month, 10)
  const numDay = parseInt(day, 10)

  if (isNaN(numYear) || isNaN(numMonth) || isNaN(numDay)) {
    return null
  }

  const date = new Date(Date.UTC(numYear, numMonth - 1, numDay))
  if (
    date.getUTCFullYear() !== numYear ||
    date.getUTCMonth() !== numMonth - 1 ||
    date.getUTCDate() !== numDay
  ) {
    return null
  }

  return date
}

const ACTIVITY_DATES_VIEW_ROUTE = 'exemption/activity-dates/index'

const activityDatesViewContent = {
  title: 'Activity Dates',
  descriptionParagraphs: [
    "Enter the activity dates. Allow time for potential delays, like consents (for example, a river works licence) or bad weather. If you miss the dates, you'll need to restart the process.",
    "You can enter a start date from today and begin your activity as soon as you've sent your information."
  ],
  backLink: '/exemption/task-list',
  formAction: '/activity-dates',
  formMethod: 'POST'
}

const errorMessages = {
  [JOI_ERRORS.ACTIVITY_START_DATE_DAY]: 'The start date must include a day',
  [JOI_ERRORS.ACTIVITY_START_DATE_MONTH]: 'The start date must include a month',
  [JOI_ERRORS.ACTIVITY_START_DATE_YEAR]: 'The start date must include a year',
  [JOI_ERRORS.ACTIVITY_END_DATE_DAY]: 'The end date must include a day',
  [JOI_ERRORS.ACTIVITY_END_DATE_MONTH]: 'The end date must include a month',
  [JOI_ERRORS.ACTIVITY_END_DATE_YEAR]: 'The end date must include a year',
  [JOI_ERRORS.CUSTOM_START_DATE_INVALID]: 'The start date must be a real date',
  [JOI_ERRORS.CUSTOM_END_DATE_INVALID]: 'The end date must be a real date',
  [JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]:
    'The start date must be today or in the future',
  [JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]:
    'The end date must be today or in the future',
  [JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]:
    'The end date must be the same as or after the start date',
  [JOI_ERRORS.CUSTOM_START_DATE_MISSING]: 'Enter the start date',
  [JOI_ERRORS.CUSTOM_END_DATE_MISSING]: 'Enter the end date'
}

const FIELDS = {
  ACTIVITY_START_DATE_DAY: 'activity-start-date-day',
  ACTIVITY_START_DATE_MONTH: 'activity-start-date-month',
  ACTIVITY_START_DATE_YEAR: 'activity-start-date-year',
  ACTIVITY_END_DATE_DAY: 'activity-end-date-day',
  ACTIVITY_END_DATE_MONTH: 'activity-end-date-month',
  ACTIVITY_END_DATE_YEAR: 'activity-end-date-year'
}

/**
 * A GDS styled project name page controller.
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
      ...activityDatesViewContent,
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
 * A GDS styled project name page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const activityDatesSubmitController = {
  options: {
    validate: {
      payload: activityStartEndDateSchema,
      failAction: (request, h, err) => {
        const { payload } = request
        const { details } = err
        let errorSummary = mapErrorsForDisplay(details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)

        const isStartMissing =
          errors[JOI_ERRORS.ACTIVITY_START_DATE_DAY] &&
          errors[JOI_ERRORS.ACTIVITY_START_DATE_MONTH] &&
          errors[JOI_ERRORS.ACTIVITY_START_DATE_YEAR]
        const isEndMissing =
          errors[JOI_ERRORS.ACTIVITY_END_DATE_DAY] &&
          errors[JOI_ERRORS.ACTIVITY_END_DATE_MONTH] &&
          errors[JOI_ERRORS.ACTIVITY_END_DATE_YEAR]

        let startDateErrorMessage
        let endDateErrorMessage

        if (isStartMissing) {
          errorSummary = errorSummary.filter(
            (error) => !error.href.includes('#activity-start-date')
          )
          errorSummary.unshift({
            href: '#activity-start-date-day',
            text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_MISSING]
          })
          errors['activity-start-date'] = {
            text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_MISSING]
          }

          startDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_MISSING]
          }
        } else {
          const hasStartDateTodayOrFutureError = Object.values(errors).some(
            (error) =>
              error.text ===
              errorMessages[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]
          )

          const hasStartDateInvalidError = Object.values(errors).some(
            (error) =>
              error.text === errorMessages[JOI_ERRORS.CUSTOM_START_DATE_INVALID]
          )

          if (hasStartDateTodayOrFutureError) {
            startDateErrorMessage = {
              text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE]
            }
          } else if (hasStartDateInvalidError) {
            startDateErrorMessage = {
              text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_INVALID]
            }
          }
        }

        if (isEndMissing) {
          errorSummary = errorSummary.filter(
            (error) => !error.href.includes('#activity-end-date')
          )
          errorSummary.push({
            href: '#activity-end-date-day',
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_MISSING]
          })
          errors['activity-end-date'] = {
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_MISSING]
          }
          endDateErrorMessage = {
            text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_MISSING]
          }
        } else {
          const hasEndDateInvalidError = Object.values(errors).some(
            (error) =>
              error.text === errorMessages[JOI_ERRORS.CUSTOM_END_DATE_INVALID]
          )

          const hasEndDateTodayOrFutureError = Object.values(errors).some(
            (error) =>
              error.text ===
              errorMessages[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]
          )

          const hasEndDateBeforeStartError = Object.values(errors).some(
            (error) =>
              error.text ===
              errorMessages[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]
          )

          if (hasEndDateInvalidError) {
            endDateErrorMessage = {
              text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_INVALID]
            }
          } else if (hasEndDateTodayOrFutureError) {
            endDateErrorMessage = {
              text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_TODAY_OR_FUTURE]
            }
          } else if (hasEndDateBeforeStartError) {
            endDateErrorMessage = {
              text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]
            }
          }
        }

        const viewData = {
          ...activityDatesViewContent,
          projectName: getExemptionCache(request).projectName,
          activityStartDateDay: payload[FIELDS.ACTIVITY_START_DATE_DAY],
          activityStartDateMonth: payload[FIELDS.ACTIVITY_START_DATE_MONTH],
          activityStartDateYear: payload[FIELDS.ACTIVITY_START_DATE_YEAR],
          activityEndDateDay: payload[FIELDS.ACTIVITY_END_DATE_DAY],
          activityEndDateMonth: payload[FIELDS.ACTIVITY_END_DATE_MONTH],
          activityEndDateYear: payload[FIELDS.ACTIVITY_END_DATE_YEAR],
          errors,
          errorSummary,
          startDateErrorMessage,
          endDateErrorMessage
        }
        return h.view(ACTIVITY_DATES_VIEW_ROUTE, viewData).takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)

    try {
      const start = createDateFromInput(
        payload['activity-start-date-year'],
        payload['activity-start-date-month'],
        payload['activity-start-date-day']
      )

      const end = createDateFromInput(
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
          }
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
      const { details } = e.data?.validation ?? {}
      if (!details) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)
      const errors = errorDescriptionByFieldName(errorSummary)
      return h.view(ACTIVITY_DATES_VIEW_ROUTE, {
        ...activityDatesViewContent,
        projectName: exemption.projectName,
        payload,
        errors,
        activityStartDateDay: payload[FIELDS.ACTIVITY_START_DATE_DAY],
        activityStartDateMonth: payload[FIELDS.ACTIVITY_START_DATE_MONTH],
        activityStartDateYear: payload[FIELDS.ACTIVITY_START_DATE_YEAR],
        activityEndDateDay: payload[FIELDS.ACTIVITY_END_DATE_DAY],
        activityEndDateMonth: payload[FIELDS.ACTIVITY_END_DATE_MONTH],
        activityEndDateYear: payload[FIELDS.ACTIVITY_END_DATE_YEAR],
        errorSummary
      })
    }
  }
}
