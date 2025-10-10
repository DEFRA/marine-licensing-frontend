import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import {
  setSiteData,
  setSiteDataPreHandler
} from '#src/server/common/helpers/session-cache/site-utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'

import joi from 'joi'

export const COORDINATE_SYSTEM_VIEW_ROUTE =
  'exemption/site-details/coordinate-system/index'

const coordinateSystemSettings = {
  pageTitle: 'Which coordinate system do you want to use?',
  heading: 'Which coordinate system do you want to use?',
  backLink: routes.COORDINATES_ENTRY_CHOICE
}

export const errorMessages = {
  COORDINATE_SYSTEM_REQUIRED: 'Select which coordinate system you want to use'
}
export const coordinateSystemController = {
  options: { pre: [setSiteDataPreHandler] },
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { siteIndex, queryParams } = request.site

    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)

    return h.view(COORDINATE_SYSTEM_VIEW_ROUTE, {
      ...coordinateSystemSettings,
      backLink: coordinateSystemSettings.backLink + queryParams,
      projectName: exemption.projectName,
      payload: {
        coordinateSystem: siteDetails.coordinateSystem
      }
    })
  }
}
export const coordinateSystemSubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
    validate: {
      payload: joi.object({
        coordinateSystem: joi
          .string()
          .valid('wgs84', 'osgb36')
          .required()
          .messages({
            'any.only': 'COORDINATE_SYSTEM_REQUIRED',
            'string.empty': 'COORDINATE_SYSTEM_REQUIRED',
            'any.required': 'COORDINATE_SYSTEM_REQUIRED'
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        const { projectName } = getExemptionCache(request)

        const site = setSiteData(request)
        const { queryParams } = site

        if (!err.details) {
          return h
            .view(COORDINATE_SYSTEM_VIEW_ROUTE, {
              ...coordinateSystemSettings,
              backLink: coordinateSystemSettings.backLink + queryParams,
              payload,
              projectName
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(COORDINATE_SYSTEM_VIEW_ROUTE, {
            ...coordinateSystemSettings,
            backLink: coordinateSystemSettings.backLink + queryParams,

            payload,
            projectName,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  handler(request, h) {
    const { payload, site } = request
    const { siteIndex, queryParams } = site

    const exemption = getExemptionCache(request)

    updateExemptionSiteDetails(
      request,
      siteIndex,
      'coordinateSystem',
      payload.coordinateSystem
    )

    if (
      getSiteDetailsBySite(exemption, siteIndex)?.coordinatesEntry === 'single'
    ) {
      return h.redirect(routes.CIRCLE_CENTRE_POINT + queryParams)
    }

    if (
      getSiteDetailsBySite(exemption, siteIndex)?.coordinatesEntry ===
      'multiple'
    ) {
      return h.redirect(routes.ENTER_MULTIPLE_COORDINATES + queryParams)
    }

    return h.view(COORDINATE_SYSTEM_VIEW_ROUTE, {
      ...coordinateSystemSettings,
      backLink: coordinateSystemSettings.backLink + queryParams,
      projectName: exemption.projectName,
      payload: {
        coordinateSystem: payload.coordinateSystem
      }
    })
  }
}
