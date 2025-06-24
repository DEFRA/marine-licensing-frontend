import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { routes } from '~/src/server/common/constants/routes.js'

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

/**
 * A GDS styled page controller for the coordinates type page.
 * @satisfies {Partial<ServerRoute>}
 */
export const coordinatesTypeController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    const siteDetails = exemption.siteDetails ?? {}

    return h.view(PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE, {
      ...provideCoordinatesSettings,
      projectName: exemption.projectName,
      payload: {
        coordinatesType: siteDetails.coordinatesType
      }
    })
  }
}

/**
 * A GDS styled page controller for the POST route in the coordinates type page.
 * @satisfies {Partial<ServerRoute>}
 */
export const coordinatesTypeSubmitController = {
  options: {
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
      'coordinatesType',
      payload.coordinatesType
    )

    if (payload.coordinatesType === 'coordinates') {
      return h.redirect(routes.COORDINATES_ENTRY_CHOICE).takeover()
    } else {
      // the 'file' case is at this point in the code flow is the only
      // reachable option, as the validator explicitly lists all available valid choices.
      return h.redirect(routes.CHOOSE_FILE_UPLOAD_TYPE).takeover()
    }
  }
}
