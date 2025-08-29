import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { getSiteNumber } from '~/src/server/exemption/site-details/utils/site-number.js'
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

const createValidationFailAction = (request, h, err) => {
  const { payload } = request
  const exemption = getExemptionCache(request)
  const siteNumber = getSiteNumber(exemption, request)

  if (!err.details) {
    return h
      .view(SITE_NAME_VIEW_ROUTE, {
        ...siteNameSettings,
        backLink: routes.MULTIPLE_SITES_CHOICE,
        payload,
        projectName: exemption.projectName,
        siteNumber
      })
      .takeover()
  }

  const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
  const errors = errorDescriptionByFieldName(errorSummary)

  return h
    .view(SITE_NAME_VIEW_ROUTE, {
      ...siteNameSettings,
      backLink: routes.MULTIPLE_SITES_CHOICE,
      payload,
      projectName: exemption.projectName,
      siteNumber,
      errors,
      errorSummary
    })
    .takeover()
}

export const siteNameController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const siteNumber = getSiteNumber(exemption, request)

    return h.view(SITE_NAME_VIEW_ROUTE, {
      ...siteNameSettings,
      backLink: routes.MULTIPLE_SITES_CHOICE,
      projectName: exemption.projectName,
      siteNumber,
      payload: {
        siteName: exemption.siteDetails?.siteName
      }
    })
  }
}

export const siteNameSubmitController = {
  options: {
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
  handler(request, h) {
    const { payload } = request

    updateExemptionSiteDetails(request, 'siteName', payload.siteName)

    return h.redirect(routes.SAME_ACTIVITY_DATES)
  }
}
