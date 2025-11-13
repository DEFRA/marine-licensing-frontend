import {
  getExemptionCache,
  resetExemptionSiteDetails,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/session-cache/site-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'

import joi from 'joi'

export const PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE =
  'exemption/site-details/coordinates-type/index'

const provideCoordinatesSettings = {
  pageTitle: 'How do you want to provide the site location?',
  heading: 'How do you want to provide the site location?'
}

export const errorMessages = {
  PROVIDE_COORDINATES_CHOICE_REQUIRED:
    'Select how you want to provide the site location'
}
export const coordinatesTypeController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { site } = request
    const { siteIndex } = site
    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)

    return h.view(PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE, {
      ...provideCoordinatesSettings,
      backLink: routes.SITE_DETAILS,
      projectName: exemption.projectName,
      payload: {
        coordinatesType: siteDetails.coordinatesType
      }
    })
  }
}
export const coordinatesTypeSubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
    validate: {
      payload: joi.object({
        coordinatesType: joi
          .string()
          .valid('file', 'coordinates')
          .required()
          .messages({
            'any.only': 'PROVIDE_COORDINATES_CHOICE_REQUIRED',
            'string.empty': 'PROVIDE_COORDINATES_CHOICE_REQUIRED',
            'any.required': 'PROVIDE_COORDINATES_CHOICE_REQUIRED'
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request
        const { projectName } = getExemptionCache(request)

        if (!err.details) {
          return h
            .view(PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE, {
              ...provideCoordinatesSettings,
              backLink: routes.SITE_DETAILS,
              payload,
              projectName
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE, {
            ...provideCoordinatesSettings,
            backLink: routes.SITE_DETAILS,
            payload,
            projectName,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)

    const { siteIndex, queryParams } = request.site

    const currentSite = exemption.siteDetails?.[siteIndex]

    const hasChangedCoordinatesType =
      currentSite?.coordinatesType &&
      payload.coordinatesType !== currentSite.coordinatesType

    if (hasChangedCoordinatesType) {
      await resetExemptionSiteDetails(request, h)
    }

    await updateExemptionSiteDetails(
      request,
      h,
      siteIndex,
      'coordinatesType',
      payload.coordinatesType
    )

    if (payload.coordinatesType === 'coordinates') {
      return h.redirect(routes.MULTIPLE_SITES_CHOICE + queryParams).takeover()
    } else {
      // the 'file' case is at this point in the code flow is the only
      // reachable option, as the validator explicitly lists all available valid choices.
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE + queryParams).takeover()
    }
  }
}
