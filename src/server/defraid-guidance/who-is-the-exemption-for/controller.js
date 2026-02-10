import joi from 'joi'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'
import { cacheMcmsContextFromQueryParams } from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { clearExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'

const title = 'Who is this exempt activity notification for?'
const viewData = {
  pageTitle: title,
  heading: title
}
export const pathToPageTemplate =
  'defraid-guidance/who-is-the-exemption-for/index'
export const errorMessages = {
  WHO_IS_EXEMPTION_FOR_REQUIRED:
    'Select who the exempt activity notification is for'
}

export const defraIdGuidanceWhoIsExemptionForController = {
  async handler(request, h) {
    if (request.state?.userSession) {
      return h.redirect(routes.PROJECT_NAME)
    }

    if (request.query.ACTIVITY_TYPE) {
      cacheMcmsContextFromQueryParams(request)
    }
    await clearExemptionCache(request, h)

    return h.view(pathToPageTemplate, viewData)
  }
}

export const defraIdGuidanceWhoIsExemptionForSubmitController = {
  options: {
    auth: false,
    validate: {
      payload: joi.object({
        whoIsExemptionFor: joi
          .string()
          .valid('individual', 'organisation', 'client')
          .required()
          .messages({
            'any.only': 'WHO_IS_EXEMPTION_FOR_REQUIRED',
            'string.empty': 'WHO_IS_EXEMPTION_FOR_REQUIRED',
            'any.required': 'WHO_IS_EXEMPTION_FOR_REQUIRED'
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request
        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)
        return h
          .view(pathToPageTemplate, {
            ...viewData,
            payload,
            errorMessage: errors.whoIsExemptionFor,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { whoIsExemptionFor } = request.payload

    if (whoIsExemptionFor === 'individual') {
      return h.redirect(routes.SIGNIN)
    }

    if (whoIsExemptionFor === 'organisation') {
      return h.redirect(routes.defraIdGuidance.CHECK_SETUP_EMPLOYEE)
    }

    return h.redirect(routes.defraIdGuidance.WHO_IS_EXEMPTION_FOR)
  }
}
