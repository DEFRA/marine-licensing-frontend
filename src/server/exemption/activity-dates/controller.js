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
import { schema } from '~/src/server/common/helpers/validators/date.js'

const ACTIVITY_DATES_VIEW_ROUTE = 'exemption/activity-dates/index'

const errorMessages = {
  ACTIVITY_START_DATE_DAY_INVALID: 'Start date day is invalid',
  ACTIVITY_START_DATE_DAY_REQUIRED: 'Start date day is required',
  ACTIVITY_START_DATE_MONTH_INVALID: 'Start date month is invalid',
  ACTIVITY_START_DATE_MONTH_REQUIRED: 'Start date month is required',
  ACTIVITY_START_DATE_YEAR_INVALID: 'Start date year is invalid',
  ACTIVITY_START_DATE_YEAR_REQUIRED: 'Start date year is required',
  ACTIVITY_START_DATE_REQUIRED: 'Start date is required',
  ACTIVITY_END_DATE_DAY_INVALID: 'End date day is invalid',
  ACTIVITY_END_DATE_DAY_REQUIRED: 'End date day is required',
  ACTIVITY_END_DATE_MONTH_INVALID: 'End date month is invalid',
  ACTIVITY_END_DATE_MONTH_REQUIRED: 'End date month is required',
  ACTIVITY_END_DATE_YEAR_INVALID: 'End date year is invalid',
  ACTIVITY_END_DATE_YEAR_REQUIRED: 'End date year is required',
  ACTIVITY_END_DATE_REQUIRED: 'End date year is required'
} // TODO: move to date validator

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
      payload: schema,
      // payload: joi.object({
      //   'activity-start-date-day': joi.string().required().messages({
      //     'string.empty': 'The start date must include a day'
      //   }),
      //   'activity-start-date-month': joi.string().required().messages({
      //     'string.empty': 'The start date must include a month'
      //   }),
      //   'activity-start-date-year': joi.string().required().messages({
      //     'string.empty': 'The start date must include a year'
      //   }),
      //   'activity-end-date-day': joi.string().required().messages({
      //     'string.empty': 'The end date must include a day'
      //   }),
      //   'activity-end-date-month': joi.string().required().messages({
      //     'string.empty': 'The end date must include a month'
      //   }),
      //   'activity-end-date-year': joi.string().required().messages({
      //     'string.empty': 'The end date must include a year'
      //   })
      // }), // TODO: remove when date validator is ready
      failAction: (request, h, err) => {
        const { payload } = request

        if (!err.details) {
          return h
            .view(ACTIVITY_DATES_VIEW_ROUTE, {
              ...activityDatesViewContent,
              payload
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(ACTIVITY_DATES_VIEW_ROUTE, {
            ...activityDatesViewContent,
            payload,
            activityStartDateDay: payload['activity-start-date-day'] || '',
            activityStartDateMonth: payload['activity-start-date-month'] || '',
            activityStartDateYear: payload['activity-start-date-year'] || '',
            activityEndDateDay: payload['activity-end-date-day'] || '',
            activityEndDateMonth: payload['activity-end-date-month'] || '',
            activityEndDateYear: payload['activity-end-date-year'] || '',

            errors,
            errorSummary
          })
          .takeover()
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
        activityEndDateDay: exemption.activityDates?.start?.day || '',
        activityEndDateMonth: exemption.activityDates?.start?.month || '',
        activityEndDateYear: exemption.activityDates?.start?.year || '',
        errors,
        errorSummary
      })
    }
  }
}
