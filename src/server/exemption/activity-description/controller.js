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
import { routes } from '#src/server/common/constants/routes.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/save-site-details.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'
import joi from 'joi'
import { getBackLink, getNextRoute } from './utils.js'
import { copySameActivityDescriptionToAllSites } from '#src/server/common/helpers/copy-same-activity-data.js'

export const ACTIVITY_DESCRIPTION_VIEW_ROUTE =
  'exemption/activity-description/index'

const ACTIVITY_DESCRIPTION_FIELD_MAX_LENGTH = 4000

export const errorMessages = {
  ACTIVITY_DESCRIPTION_REQUIRED: 'Enter the activity description',
  ACTIVITY_DESCRIPTION_MAX_LENGTH: `Activity description must be ${ACTIVITY_DESCRIPTION_FIELD_MAX_LENGTH} characters or less`
}

const templateValues = {
  pageTitle: 'Activity description',
  heading: 'Activity description'
}

const getBackLinkForAction = (
  action,
  siteNumber,
  exemption,
  siteIndex,
  queryParams
) => {
  if (action) {
    return `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
  }
  return getBackLink(exemption, siteIndex, queryParams)
}

const getPageTemplateValues = (request) => {
  const exemption = getExemptionCache(request)
  const action = request.query.action

  const { siteNumber, siteIndex, queryParams } = request.site ?? {}

  const { multipleSiteDetails } = exemption

  const variableActivityDescription =
    multipleSiteDetails?.sameActivityDescription === 'no'

  return {
    ...templateValues,
    isMultiSiteJourney: !!multipleSiteDetails?.multipleSitesEnabled,
    backLink: getBackLinkForAction(
      action,
      siteNumber,
      exemption,
      siteIndex,
      queryParams
    ),
    cancelLink: getCancelLink(action),
    projectName: exemption.projectName,
    siteNumber: variableActivityDescription ? siteNumber : null,
    action
  }
}
export const activityDescriptionController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { siteIndex } = request.site ?? {}

    const activityDescription = getSiteDetailsBySite(
      exemption,
      siteIndex
    )?.activityDescription

    return h.view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
      ...getPageTemplateValues(request),
      payload: { activityDescription }
    })
  }
}
export const activityDescriptionSubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
    validate: {
      payload: joi.object({
        activityDescription: joi
          .string()
          .min(1)
          .max(ACTIVITY_DESCRIPTION_FIELD_MAX_LENGTH)
          .required()
          .messages({
            'string.empty': errorMessages.ACTIVITY_DESCRIPTION_REQUIRED,
            'string.max': errorMessages.ACTIVITY_DESCRIPTION_MAX_LENGTH
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        if (!err.details) {
          return h
            .view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
              ...getPageTemplateValues(request),
              payload
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
            ...getPageTemplateValues(request),
            payload,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    try {
      const exemption = getExemptionCache(request)
      const { siteIndex } = request.site

      await updateExemptionSiteDetails(
        request,
        h,
        siteIndex,
        'activityDescription',
        payload.activityDescription
      )

      const hasSameActivityDescriptionAcrossSites =
        exemption.multipleSiteDetails?.sameActivityDescription === 'yes'

      const action = request.query.action
      const { siteNumber } = request.site

      const anchor = hasSameActivityDescriptionAcrossSites
        ? ''
        : `#site-details-${siteNumber}`

      const nextRoute = action
        ? `${routes.REVIEW_SITE_DETAILS}${anchor}`
        : getNextRoute(request.site)

      if (nextRoute === routes.REVIEW_SITE_DETAILS || action) {
        if (hasSameActivityDescriptionAcrossSites) {
          await copySameActivityDescriptionToAllSites(request, h)
        }

        await saveSiteDetailsToBackend(request, h)
      }

      return h.redirect(nextRoute)
    } catch (e) {
      const { details } = e.data?.payload?.validation ?? {}
      if (!details) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)
      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
        ...getPageTemplateValues(request),
        payload,
        errors,
        errorSummary
      })
    }
  }
}
