import {
  getExemptionCache,
  setExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { getMultipleSitesEnabledValue } from './utils.js'
import joi from 'joi'

export const MULTIPLE_SITES_VIEW_ROUTE =
  'exemption/site-details/multiple-sites-question/index'

export const MULTIPLE_SITES_URL =
  '/exemption/does-your-project-involve-more-than-one-site'

const multipleSitesSettings = {
  pageTitle: 'Do you need to tell us about more than one site?',
  heading: 'Do you need to tell us about more than one site?'
}

export const errorMessages = {
  MULTIPLE_SITES_REQUIRED:
    'Select whether you need to tell us about more than one site'
}

const createValidationFailAction = (request, h, err) => {
  const { payload } = request
  const { projectName } = getExemptionCache(request)

  if (!err.details) {
    return h
      .view(MULTIPLE_SITES_VIEW_ROUTE, {
        ...multipleSitesSettings,
        backLink: routes.COORDINATES_TYPE_CHOICE,
        payload,
        projectName
      })
      .takeover()
  }

  const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
  const errors = errorDescriptionByFieldName(errorSummary)

  return h
    .view(MULTIPLE_SITES_VIEW_ROUTE, {
      ...multipleSitesSettings,
      backLink: routes.COORDINATES_TYPE_CHOICE,
      payload,
      projectName,
      errors,
      errorSummary
    })
    .takeover()
}

export const multipleSitesController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(MULTIPLE_SITES_VIEW_ROUTE, {
      ...multipleSitesSettings,
      backLink: routes.COORDINATES_TYPE_CHOICE,
      projectName: exemption.projectName,
      payload: {
        multipleSitesEnabled: getMultipleSitesEnabledValue(
          exemption.multipleSiteDetails
        )
      }
    })
  }
}

export const multipleSitesSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        multipleSitesEnabled: joi
          .string()
          .valid('yes', 'no')
          .required()
          .messages({
            'any.only': 'MULTIPLE_SITES_REQUIRED',
            'string.empty': 'MULTIPLE_SITES_REQUIRED',
            'any.required': 'MULTIPLE_SITES_REQUIRED'
          })
      }),
      failAction: createValidationFailAction
    }
  },
  async handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)

    const multiSiteValue = payload.multipleSitesEnabled === 'yes'

    if (payload.multipleSitesEnabled === 'no' && exemption.siteDetails) {
      const siteDetails = getSiteDetailsBySite(exemption)
      delete siteDetails.siteName
    }

    await setExemptionCache(request, h, {
      ...exemption,
      multipleSiteDetails: { multipleSitesEnabled: multiSiteValue }
    })

    if (payload.multipleSitesEnabled === 'no') {
      return h.redirect(routes.ACTIVITY_DATES)
    } else {
      return h.redirect(routes.SITE_NAME)
    }
  }
}
