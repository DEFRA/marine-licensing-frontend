import {
  ACTIVITY_DATE_FIELD_NAMES,
  ACTIVITY_DATES_CONFIG,
  ACTIVITY_DATES_ERROR_MESSAGES,
  ACTIVITY_DATES_VIEW_ROUTE,
  ACTIVITY_DATES_VIEW_SETTINGS,
  DATE_EXTRACTION_CONFIG
} from '#src/server/common/constants/activity-dates.js'
import { routes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/save-site-details.js'
import { processDateValidationErrors } from '#src/server/common/helpers/dates/date-form-utils.js'
import {
  createDateFieldsFromValue,
  createDateISO,
  extractMultipleDateFields
} from '#src/server/common/helpers/dates/date-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import {
  getExemptionCache,
  setExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/session-cache/site-utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import { activityDatesSchema } from '#src/server/common/schemas/date.js'
import { getSiteNumber } from '#src/server/exemption/site-details/utils/site-number.js'
import { getBackRoute, getNextRoute } from './utils.js'

const isPageInSiteDetailsFlow = (request) =>
  request.url.pathname === routes.SITE_DETAILS_ACTIVITY_DATES

const getCancelLink = (action, siteNumber) => {
  return action
    ? `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
    : routes.TASK_LIST + '?cancel=site-details'
}

const getBackLink = (siteIndex, action, siteNumber, queryParams, exemption) => {
  if (action) {
    return `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
  }
  return getBackRoute({ siteIndex, queryParams }, exemption)
}

const createTemplateData = (
  request,
  exemption,
  payload,
  siteIndex = 0,
  queryParams = ''
) => {
  let dateFields

  const isInSiteDetailsFlow = isPageInSiteDetailsFlow(request)
  const action = request.query?.action

  if (Object.keys(payload).length > 0) {
    dateFields = extractMultipleDateFields(payload, DATE_EXTRACTION_CONFIG)
  } else {
    const startDateFields = createDateFieldsFromValue(
      isInSiteDetailsFlow
        ? getSiteDetailsBySite(exemption, siteIndex).activityDates?.start
        : exemption.activityDates?.start
    )
    const endDateFields = createDateFieldsFromValue(
      isInSiteDetailsFlow
        ? getSiteDetailsBySite(exemption, siteIndex)?.activityDates?.end
        : exemption.activityDates?.end
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

  if (isInSiteDetailsFlow) {
    const { multipleSiteDetails } = exemption

    const siteNumber = getSiteNumber(exemption, request)

    const variableActivityDates =
      multipleSiteDetails?.sameActivityDates === 'no'

    return {
      ...ACTIVITY_DATES_VIEW_SETTINGS,
      projectName: exemption.projectName,
      ...dateFields,
      backLink: getBackLink(
        siteIndex,
        action,
        siteNumber,
        queryParams,
        exemption
      ),
      cancelLink: getCancelLink(action, siteNumber),
      isSiteDetailsFlow: true,
      isMultiSiteJourney: !!multipleSiteDetails?.multipleSitesEnabled,
      isSameActivityDates: multipleSiteDetails?.sameActivityDates === 'yes',
      siteNumber: variableActivityDates ? siteNumber : null,
      action
    }
  }

  return {
    ...ACTIVITY_DATES_VIEW_SETTINGS,
    projectName: exemption.projectName,
    ...dateFields
  }
}

export const activityDatesController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { siteIndex, queryParams } = request.site
    return h.view(
      ACTIVITY_DATES_VIEW_ROUTE,
      createTemplateData(request, exemption, {}, siteIndex, queryParams)
    )
  }
}

function handleValidationErrors(request, h, err) {
  const exemption = getExemptionCache(request)
  const { payload, site } = request
  const { siteIndex, queryParams } = site ?? {}

  const validationResult = processDateValidationErrors(
    err,
    ACTIVITY_DATES_CONFIG,
    ACTIVITY_DATES_ERROR_MESSAGES
  )

  if (!validationResult) {
    return h
      .view(
        ACTIVITY_DATES_VIEW_ROUTE,
        createTemplateData(request, exemption, payload, siteIndex, queryParams)
      )
      .takeover()
  }

  return h
    .view(ACTIVITY_DATES_VIEW_ROUTE, {
      ...createTemplateData(
        request,
        exemption,
        payload,
        siteIndex,
        queryParams
      ),
      ...validationResult
    })
    .takeover()
}

export const activityDatesSubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
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

      const isInSiteDetailsFlow = isPageInSiteDetailsFlow(request)

      if (isInSiteDetailsFlow) {
        const { siteIndex } = request.site
        updateExemptionSiteDetails(request, siteIndex, 'activityDates', {
          start,
          end
        })
      } else {
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
      }

      const action = request.query?.action
      const { siteNumber } = request.site

      const nextRoute = action
        ? `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
        : getNextRoute(
            exemption,
            isInSiteDetailsFlow,
            request.site?.queryParams
          )

      if (action) {
        await saveSiteDetailsToBackend(request)
      }

      return h.redirect(nextRoute)
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

      const { siteIndex, queryParams } = request.site
      return h.view(ACTIVITY_DATES_VIEW_ROUTE, {
        ...createTemplateData(
          request,
          exemption,
          payload,
          siteIndex,
          queryParams
        ),
        errors,
        errorSummary
      })
    }
  }
}
