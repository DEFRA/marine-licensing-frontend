import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/exemptions/session-cache/site-utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'
import { getBackLink, getNextRoute } from './utils.js'
import { copySameActivityDescriptionToAllSites } from '#src/server/common/helpers/exemptions/copy-same-activity-data.js'
import { activityDescriptionSchema } from '#src/server/common/validation/activity-description/schema.js'
import { activityDescriptionErrorMessages as errorMessages } from '#src/server/common/validation/activity-description/constants.js'

export const ACTIVITY_DESCRIPTION_VIEW_ROUTE =
  'exemption/activity-description/index'

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
      payload: activityDescriptionSchema,
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
