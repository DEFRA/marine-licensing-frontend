import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getCommonRedirectLink } from '#src/server/common/helpers/marine-licence/redirect-link.js'

export const PREFERRED_DATES_VIEW_ROUTE = 'marine-licence/preferred-dates/index'

const PAGE_TITLE =
  'What are your preferred start and end dates for the licence?'

const settings = {
  pageTitle: PAGE_TITLE,
  heading: PAGE_TITLE
}

const parseDateToPayload = (dateObj, prefix) => {
  if (!dateObj) {
    return {}
  }
  return {
    [`${prefix}-month`]: dateObj.month,
    [`${prefix}-year`]: dateObj.year
  }
}

export const preferredDatesController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const cached = marineLicence.preferredDates || {}
    const currentYear = new Date().getFullYear()

    return h.view(PREFERRED_DATES_VIEW_ROUTE, {
      ...settings,
      projectName: marineLicence.projectName,
      payload: {
        ...parseDateToPayload(cached.start, 'start-date'),
        ...parseDateToPayload(cached.end, 'end-date')
      },
      backLink: getCommonRedirectLink(request),
      currentYear,
      nextYear: currentYear + 1
    })
  }
}

export const preferredDatesSubmitController = {
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)

    try {
      const start = {
        month: String(payload['start-date-month']).padStart(2, '0'),
        year: payload['start-date-year']
      }
      const end = {
        month: String(payload['end-date-month']).padStart(2, '0'),
        year: payload['end-date-year']
      }

      await authenticatedPatchRequest(
        request,
        apiRoutes.UPDATE_PREFERRED_DATES,
        {
          start,
          end,
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        preferredDates: { start, end }
      })

      return h.redirect(getCommonRedirectLink(request))
    } catch (e) {
      const validation = e.data?.payload?.validation
      const details = validation?.details

      if (!Array.isArray(details)) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, {})
      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(PREFERRED_DATES_VIEW_ROUTE, {
        ...settings,
        payload,
        projectName: marineLicence.projectName,
        backLink: getCommonRedirectLink(request),
        errors,
        errorSummary
      })
    }
  }
}
