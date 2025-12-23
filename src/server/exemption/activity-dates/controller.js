import {
  ACTIVITY_DATE_FIELD_NAMES,
  ACTIVITY_DATES_CONFIG,
  ACTIVITY_DATES_ERROR_MESSAGES,
  ACTIVITY_DATES_VIEW_ROUTE,
  ACTIVITY_DATES_VIEW_SETTINGS,
  DATE_EXTRACTION_CONFIG
} from '#src/server/common/constants/activity-dates.js'
import { routes } from '#src/server/common/constants/routes.js'
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
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/session-cache/site-utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import { activityDatesSchema } from '#src/server/common/schemas/date.js'
import { getSiteNumber } from '#src/server/exemption/site-details/utils/site-number.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'
import { getBackRoute, getNextRoute } from './utils.js'
import { copySameActivityDatesToAllSites } from '#src/server/common/helpers/copy-same-activity-data.js'
import { getExemptionService } from '#src/services/exemption-service/index.js'

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

  const action = request.query.action

  if (Object.keys(payload).length > 0) {
    dateFields = extractMultipleDateFields(payload, DATE_EXTRACTION_CONFIG)
  } else {
    const startDateFields = createDateFieldsFromValue(
      getSiteDetailsBySite(exemption, siteIndex).activityDates?.start
    )
    const endDateFields = createDateFieldsFromValue(
      getSiteDetailsBySite(exemption, siteIndex)?.activityDates?.end
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

  const { multipleSiteDetails } = exemption

  const siteNumber = getSiteNumber(exemption, request)

  const variableActivityDates = multipleSiteDetails?.sameActivityDates === 'no'

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
    cancelLink: getCancelLink(action),
    isMultiSiteJourney: !!multipleSiteDetails?.multipleSitesEnabled,
    isSameActivityDates: multipleSiteDetails?.sameActivityDates === 'yes',
    siteNumber: variableActivityDates ? siteNumber : null,
    action
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

export function handleValidationErrors(request, h, err) {
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

const validateActivityDates = async (request, h) => {
  const exemption = getExemptionCache(request)

  const exemptionService = getExemptionService(request)
  const savedExemption = await exemptionService.getExemptionById(exemption.id)

  const articleCode = savedExemption.mcmsContext?.articleCode

  const { error } = activityDatesSchema.validate(request.payload, {
    context: { articleCode },
    abortEarly: false
  })

  if (error) {
    return handleValidationErrors(request, h, error)
  }

  return h.continue
}

export const activityDatesSubmitController = {
  options: {
    pre: [setSiteDataPreHandler, validateActivityDates]
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

      const { siteIndex } = request.site
      await updateExemptionSiteDetails(request, h, siteIndex, 'activityDates', {
        start,
        end
      })

      const hasSameActivityDatesAcrossSites =
        exemption.multipleSiteDetails?.sameActivityDates === 'yes'

      const action = request.query.action
      const { siteNumber } = request.site

      const anchor = hasSameActivityDatesAcrossSites
        ? ''
        : `#site-details-${siteNumber}`

      const nextRoute = action
        ? `${routes.REVIEW_SITE_DETAILS}${anchor}`
        : getNextRoute(exemption, request.site?.queryParams)

      if (action) {
        if (hasSameActivityDatesAcrossSites) {
          await copySameActivityDatesToAllSites(request, h)
        }
        await saveSiteDetailsToBackend(request, h)
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
