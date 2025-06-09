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
import { activityStartEndDateSchema } from '~/src/server/common/schemas/date.js'

const ACTIVITY_DATES_VIEW_ROUTE = 'exemption/activity-dates/index'

const activityDatesViewContent = {
  title: 'Activity Dates',
  descriptionParagraphs: [
    "Enter the activity dates. Allow time for potential delays, like consents (for example, a river works licence) or bad weather. If you miss the dates, you'll need to restart the process.",
    "You can enter a start date from today and begin your activity as soon as you've sent your information."
  ],
  backLink: '/task-list',
  formAction: '/activity-dates',
  formMethod: 'POST'
}

const errorMessages = {
  'activity-start-date-day': 'The start date must include a day',
  'activity-start-date-month': 'The start date must include a month',
  'activity-start-date-year': 'The start date must include a year',
  'activity-end-date-day': 'The end date must include a day',
  'activity-end-date-month': 'The end date must include a month',
  'activity-end-date-year': 'The end date must include a year',
  'custom.startDate.invalid': 'The start date must be a real date',
  'custom.endDate.invalid': 'The end date must be a real date',
  'custom.startDate.todayOrFuture':
    'The start date must be today or in the future',
  'custom.endDate.before.startDate':
    'The end date must be the same as or after the start date',
  'custom.startDate.missing': 'Enter the start date',
  'custom.endDate.missing': 'Enter the end date'
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
          errors['activity-start-date-day'] &&
          errors['activity-start-date-month'] &&
          errors['activity-start-date-year']
        if (isStartMissing) {
          errorSummary = errorSummary.filter(
            (error) => !error.href.includes('#activity-start-date')
          )
          errorSummary.unshift({
            href: '#activity-start-date-day',
            text: errorMessages['custom.startDate.missing']
          })
          errors['activity-start-date'] = {
            text: errorMessages['custom.startDate.missing']
          }
        }

        const isEndMissing =
          errors['activity-end-date-day'] &&
          errors['activity-end-date-month'] &&
          errors['activity-end-date-year']
        if (isEndMissing) {
          errorSummary = errorSummary.filter(
            (error) => !error.href.includes('#activity-end-date')
          )
          errorSummary.push({
            href: '#activity-end-date-day',
            text: errorMessages['custom.endDate.missing']
          })
          errors['activity-end-date'] = {
            text: errorMessages['custom.endDate.missing']
          }
        }

        const startDateError =
          details.find(
            (d) =>
              d.path.includes('activity-start-date') ||
              d.type === 'custom.startDate.invalid'
          ) || (isStartMissing ? { message: 'custom.startDate.missing' } : null)
        const endDateError =
          details.find(
            (d) =>
              d.path.includes('activity-end-date') ||
              d.type === 'custom.endDate.invalid' ||
              d.type === 'custom.endDate.before.startDate'
          ) || (isEndMissing ? { message: 'custom.endDate.missing' } : null)

        const viewData = {
          ...activityDatesViewContent,
          activityStartDateDay: payload['activity-start-date-day'],
          activityStartDateMonth: payload['activity-start-date-month'],
          activityStartDateYear: payload['activity-start-date-year'],
          activityEndDateDay: payload['activity-end-date-day'],
          activityEndDateMonth: payload['activity-end-date-month'],
          activityEndDateYear: payload['activity-end-date-year'],
          errors,
          errorSummary,
          startDateErrorMessage: startDateError
            ? { text: errorMessages[startDateError.message] }
            : undefined,
          endDateErrorMessage: endDateError
            ? { text: errorMessages[endDateError.message] }
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
        day: payload['activity-start-date-day'],
        month: payload['activity-start-date-month'],
        year: payload['activity-start-date-year']
      }
      const end = {
        day: payload['activity-end-date-day'],
        month: payload['activity-end-date-month'],
        year: payload['activity-end-date-year']
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
