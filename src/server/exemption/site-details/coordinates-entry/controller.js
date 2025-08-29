import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { getCoordinatesEntryBackLink } from './utils.js'

import joi from 'joi'
import { routes } from '~/src/server/common/constants/routes.js'

export const COORDINATES_ENTRY_VIEW_ROUTE =
  'exemption/site-details/coordinates-entry/index'

const coordinatesEntrySettings = {
  pageTitle: 'How do you want to enter the coordinates?',
  heading: 'How do you want to enter the coordinates?'
}

export const errorMessages = {
  COORDINATES_ENTRY_REQUIRED: 'Select how you want to enter the coordinates'
}

/**
 * A GDS styled page controller for the coordinates entry page.
 * @satisfies {Partial<ServerRoute>}
 */
export const coordinatesEntryController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    const siteDetails = exemption.siteDetails ?? {}

    const backLink = getCoordinatesEntryBackLink(exemption)

    return h.view(COORDINATES_ENTRY_VIEW_ROUTE, {
      ...coordinatesEntrySettings,
      backLink,
      projectName: exemption.projectName,
      payload: {
        coordinatesEntry: siteDetails.coordinatesEntry
      }
    })
  }
}

/**
 * A GDS styled page controller for the POST route in the coordinates entry page.
 * @satisfies {Partial<ServerRoute>}
 */
export const coordinatesEntrySubmitController = {
  options: {
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

        const backLink = getCoordinatesEntryBackLink(getExemptionCache(request))

        if (!err.details) {
          return h
            .view(COORDINATES_ENTRY_VIEW_ROUTE, {
              ...coordinatesEntrySettings,
              backLink,
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
            backLink,
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

    updateExemptionSiteDetails(
      request,
      'coordinatesEntry',
      payload.coordinatesEntry
    )

    return h.redirect(routes.COORDINATE_SYSTEM_CHOICE)
  }
}
