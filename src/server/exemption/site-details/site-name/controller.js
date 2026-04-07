import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'
import {
  siteNameSettings,
  siteNameErrorMessages
} from '#src/server/common/validation/site-name/constants.js'
import { siteNameSchema } from '#src/server/common/validation/site-name/schema.js'
import {
  getSiteDataFromParam,
  hasInvalidSiteNumber,
  shouldAddNewSite
} from '#src/server/common/helpers/site-details/site-name.js'
import { addNewSite } from './utils.js'

export const SITE_NAME_VIEW_ROUTE = 'templates/site-name.njk'

const getBackLink = (siteIndex, action, siteNumber) => {
  if (action) {
    return `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
  }
  return siteIndex === 0
    ? routes.MULTIPLE_SITES_CHOICE
    : routes.REVIEW_SITE_DETAILS
}

const createValidationFailAction = (request, h, err) => {
  const { payload } = request
  const exemption = getExemptionCache(request)

  const { action, site } = request.query

  const { siteIndex, siteNumber } = getSiteDataFromParam(site)

  if (!err.details) {
    return h
      .view(SITE_NAME_VIEW_ROUTE, {
        ...siteNameSettings,
        backLink: getBackLink(siteIndex, action, siteNumber),
        cancelLink: getCancelLink(action),
        payload,
        projectName: exemption.projectName,
        siteNumber,
        action
      })
      .takeover()
  }

  const errorSummary = mapErrorsForDisplay(err.details, siteNameErrorMessages)
  const errors = errorDescriptionByFieldName(errorSummary)

  return h
    .view(SITE_NAME_VIEW_ROUTE, {
      ...siteNameSettings,
      backLink: getBackLink(siteIndex, action, siteNumber),
      cancelLink: getCancelLink(action),
      payload,
      projectName: exemption.projectName,
      siteNumber,
      action,
      errors,
      errorSummary
    })
    .takeover()
}

export const siteNameController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    const { action, site } = request.query
    const { siteDetails } = exemption

    const { siteIndex, siteNumber } = getSiteDataFromParam(site)

    if (site && hasInvalidSiteNumber(siteNumber, siteDetails)) {
      return h.redirect(routes.TASK_LIST)
    }

    const siteName = siteDetails?.[siteIndex]?.siteName ?? ''

    return h.view(SITE_NAME_VIEW_ROUTE, {
      ...siteNameSettings,
      backLink: getBackLink(siteIndex, action, siteNumber),
      cancelLink: getCancelLink(action),
      projectName: exemption.projectName,
      siteNumber,
      action,
      payload: {
        siteName
      }
    })
  }
}

export const siteNameSubmitController = {
  options: {
    validate: {
      payload: siteNameSchema,
      failAction: createValidationFailAction
    }
  },
  async handler(request, h) {
    const exemption = getExemptionCache(request)

    const { payload } = request

    const { action, site } = request.query

    const { siteIndex, siteNumber } = getSiteDataFromParam(site)

    const queryParams = site ? `?site=${site}` : ''

    const redirectRoute = action
      ? `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
      : `${routes.SAME_ACTIVITY_DATES}${queryParams}`

    if (shouldAddNewSite(site, exemption)) {
      await addNewSite(request, h, exemption, payload)
    } else {
      await updateExemptionSiteDetails(
        request,
        h,
        siteIndex,
        'siteName',
        payload.siteName
      )
    }

    if (action) {
      await saveSiteDetailsToBackend(request, h)
    }

    return h.redirect(redirectRoute)
  }
}
