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
  [JOI_ERRORS.CUSTOM_END_DATE_BEFORE_START_DATE]:
    'The end date must be the same as or after the start date',
  [JOI_ERRORS.CUSTOM_START_DATE_MISSING]: 'Enter the start date',
  [JOI_ERRORS.CUSTOM_END_DATE_MISSING]: 'Enter the end date'
}

export const activityDatesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    return h.view(ACTIVITY_DATES_VIEW_ROUTE, {
      ...activityDatesViewContent,
      activityStartDateDay: exemption.activityDates?.start?.day || '',
      activityStartDateMonth: exemption.activityDates?.start?.month || '',
      activityStartDateYear: exemption.activityDates?.start?.year || '',
      activityEndDateDay: exemption.activityDates?.end?.day || '',
      activityEndDateMonth: exemption.activityDates?.end?.month || '',
      activityEndDateYear: exemption.activityDates?.end?.year || ''
    })
  }
}

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
        }

        const viewData = {
          ...activityDatesViewContent,
          activityStartDateDay: payload[JOI_ERRORS.ACTIVITY_START_DATE_DAY],
          activityStartDateMonth: payload[JOI_ERRORS.ACTIVITY_START_DATE_MONTH],
          activityStartDateYear: payload[JOI_ERRORS.ACTIVITY_START_DATE_YEAR],
          activityEndDateDay: payload[JOI_ERRORS.ACTIVITY_END_DATE_DAY],
          activityEndDateMonth: payload[JOI_ERRORS.ACTIVITY_END_DATE_MONTH],
          activityEndDateYear: payload[JOI_ERRORS.ACTIVITY_END_DATE_YEAR],
          errors,
          errorSummary,
          startDateErrorMessage: isStartMissing
            ? { text: errorMessages[JOI_ERRORS.CUSTOM_START_DATE_MISSING] }
            : undefined,
          endDateErrorMessage: isEndMissing
            ? { text: errorMessages[JOI_ERRORS.CUSTOM_END_DATE_MISSING] }
            : undefined
        }

        return h.view(ACTIVITY_DATES_VIEW_ROUTE, viewData).takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)

    try {
      const start = {
        day: payload[JOI_ERRORS.ACTIVITY_START_DATE_DAY],
        month: payload[JOI_ERRORS.ACTIVITY_START_DATE_MONTH],
        year: payload[JOI_ERRORS.ACTIVITY_START_DATE_YEAR]
      }
      const end = {
        day: payload[JOI_ERRORS.ACTIVITY_END_DATE_DAY],
        month: payload[JOI_ERRORS.ACTIVITY_END_DATE_MONTH],
        year: payload[JOI_ERRORS.ACTIVITY_END_DATE_YEAR]
      }

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
      const validation = e.data?.payload?.validation
      const details = validation?.details
      if (Array.isArray(details)) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)
      const errors = errorDescriptionByFieldName(errorSummary)
      return h.view(ACTIVITY_DATES_VIEW_ROUTE, {
        ...activityDatesViewContent,
        payload,
        activityStartDateDay: exemption.activityDates?.start?.day || '',
        activityStartDateMonth: exemption.activityDates?.start?.month || '',
        activityStartDateYear: exemption.activityDates?.start?.year || '',
        activityEndDateDay: exemption.activityDates?.end?.day || '',
        activityEndDateMonth: exemption.activityDates?.end?.month || '',
        activityEndDateYear: exemption.activityDates?.end?.year || '',
        errors,
        errorSummary
      })
    }
  }
}
