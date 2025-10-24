import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import {
  setSiteData,
  setSiteDataPreHandler
} from '#src/server/common/helpers/session-cache/site-utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/save-site-details.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { getCancelLink } from '#src/server/exemption/site-details/utils/cancel-link.js'
import joi from 'joi'

const SITE_NAME_MAX_LENGTH = 250

export const SITE_NAME_VIEW_ROUTE = 'exemption/site-details/site-name/index'

export const SITE_NAME_URL = '/exemption/site-name'

const siteNameSettings = {
  pageTitle: 'Site name',
  heading: 'Site name'
}

export const errorMessages = {
  SITE_NAME_REQUIRED: 'Enter the site name',
  SITE_NAME_MAX_LENGTH: 'Site name should be 250 characters or less'
}

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

  const site = setSiteData(request)
  const { siteNumber, siteIndex } = site
  const action = request.query.action

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

  const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
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
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const exemption = getExemptionCache(request)

    const { site } = request
    const { siteNumber, siteIndex, siteDetails } = site
    const action = request.query.action

    return h.view(SITE_NAME_VIEW_ROUTE, {
      ...siteNameSettings,
      backLink: getBackLink(siteIndex, action, siteNumber),
      cancelLink: getCancelLink(action),
      projectName: exemption.projectName,
      siteNumber,
      action,
      payload: {
        siteName: siteDetails?.siteName
      }
    })
  }
}

export const siteNameSubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
    validate: {
      payload: joi.object({
        siteName: joi
          .string()
          .min(1)
          .max(SITE_NAME_MAX_LENGTH)
          .required()
          .messages({
            'string.empty': 'SITE_NAME_REQUIRED',
            'any.required': 'SITE_NAME_REQUIRED',
            'string.max': 'SITE_NAME_MAX_LENGTH'
          })
      }),
      failAction: createValidationFailAction
    }
  },
  async handler(request, h) {
    const { payload, site } = request

    const { queryParams, siteIndex, siteNumber } = site
    const action = request.query.action

    updateExemptionSiteDetails(request, siteIndex, 'siteName', payload.siteName)

    const redirectRoute = action
      ? `${routes.REVIEW_SITE_DETAILS}#site-details-${siteNumber}`
      : routes.SAME_ACTIVITY_DATES + queryParams

    if (action) {
      await saveSiteDetailsToBackend(request)
    }

    return h.redirect(redirectRoute)
  }
}
