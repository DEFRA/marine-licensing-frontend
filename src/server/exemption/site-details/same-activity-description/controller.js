import {
  getExemptionCache,
  updateExemptionMultipleSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import joi from 'joi'

export const SAME_ACTIVITY_DESCRIPTION_VIEW_ROUTE =
  'exemption/site-details/same-activity-description/index'

export const SAME_ACTIVITY_DESCRIPTION_URL =
  '/exemption/same-activity-description'

const sameActivityDescriptionSettings = {
  pageTitle: 'Is the activity description the same for every site?',
  heading: 'Is the activity description the same for every site?'
}

export const errorMessages = {
  SAME_ACTIVITY_DESCRIPTION_REQUIRED:
    'Select whether the activity description is the same for every site'
}

const createValidationFailAction = (request, h, err) => {
  const { payload } = request
  const exemption = getExemptionCache(request)

  if (!err.details) {
    return h
      .view(SAME_ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
        ...sameActivityDescriptionSettings,
        backLink: routes.SITE_DETAILS_ACTIVITY_DATES,
        payload,
        projectName: exemption.projectName
      })
      .takeover()
  }

  const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
  const errors = errorDescriptionByFieldName(errorSummary)

  return h
    .view(SAME_ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
      ...sameActivityDescriptionSettings,
      backLink: routes.SITE_DETAILS_ACTIVITY_DATES,
      payload,
      projectName: exemption.projectName,
      errors,
      errorSummary
    })
    .takeover()
}

/**
 * A GDS styled page controller for the same activity description page.
 * @satisfies {Partial<ServerRoute>}
 */
export const sameActivityDescriptionController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(SAME_ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
      ...sameActivityDescriptionSettings,
      backLink: routes.SITE_DETAILS_ACTIVITY_DATES,
      projectName: exemption.projectName,
      payload: {
        sameActivityDescription:
          exemption.multipleSiteDetails?.sameActivityDescription
      }
    })
  }
}

/**
 * A GDS styled page controller for the POST route in the same activity description page.
 * @satisfies {Partial<ServerRoute>}
 */
export const sameActivityDescriptionSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        sameActivityDescription: joi
          .string()
          .valid('yes', 'no')
          .required()
          .messages({
            'any.only': 'SAME_ACTIVITY_DESCRIPTION_REQUIRED',
            'string.empty': 'SAME_ACTIVITY_DESCRIPTION_REQUIRED',
            'any.required': 'SAME_ACTIVITY_DESCRIPTION_REQUIRED'
          })
      }),
      failAction: createValidationFailAction
    }
  },
  handler(request, h) {
    const { payload } = request

    updateExemptionMultipleSiteDetails(
      request,
      'sameActivityDescription',
      payload.sameActivityDescription
    )

    return h.redirect(routes.SITE_DETAILS_ACTIVITY_DESCRIPTION)
  }
}
