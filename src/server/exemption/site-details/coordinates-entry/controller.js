import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/session-cache/site-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import joi from 'joi'
import { routes } from '#src/server/common/constants/routes.js'
import { getBackRoute } from './utils.js'

export const COORDINATES_ENTRY_VIEW_ROUTE =
  'exemption/site-details/coordinates-entry/index'

const coordinatesEntrySettings = {
  pageTitle: 'How do you want to enter the coordinates?',
  heading: 'How do you want to enter the coordinates?',
  backLink: routes.ACTIVITY_DESCRIPTION
}

export const errorMessages = {
  COORDINATES_ENTRY_REQUIRED: 'Select how you want to enter the coordinates'
}
export const coordinatesEntryController = {
  options: {
    pre: [setSiteDataPreHandler]
  },
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { site } = request
    const { siteIndex } = site

    const siteDetails = getSiteDetailsBySite(exemption, siteIndex)

    return h.view(COORDINATES_ENTRY_VIEW_ROUTE, {
      ...coordinatesEntrySettings,
      backLink: getBackRoute(request, exemption),
      projectName: exemption.projectName,
      payload: {
        coordinatesEntry: siteDetails.coordinatesEntry
      }
    })
  }
}
export const coordinatesEntrySubmitController = {
  options: {
    pre: [setSiteDataPreHandler],
    validate: {
      payload: joi.object({
        coordinatesEntry: joi
          .string()
          .valid('single', 'multiple')
          .required()
          .messages({
            'any.only': 'COORDINATES_ENTRY_REQUIRED',
            'string.empty': 'COORDINATES_ENTRY_REQUIRED',
            'any.required': 'COORDINATES_ENTRY_REQUIRED'
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request
        const { projectName } = getExemptionCache(request)

        if (!err.details) {
          return h
            .view(COORDINATES_ENTRY_VIEW_ROUTE, {
              ...coordinatesEntrySettings,
              payload,
              projectName
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(COORDINATES_ENTRY_VIEW_ROUTE, {
            ...coordinatesEntrySettings,
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
    const { payload } = request

    const { siteIndex, queryParams } = request.site

    updateExemptionSiteDetails(
      request,
      siteIndex,
      'coordinatesEntry',
      payload.coordinatesEntry
    )

    return h.redirect(routes.COORDINATE_SYSTEM_CHOICE + queryParams)
  }
}
