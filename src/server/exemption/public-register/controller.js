import {
  getExemptionCache,
  setExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

import joi from 'joi'

export const PUBLIC_REGISTER_VIEW_ROUTE = 'exemption/public-register/index'

export const errorMessages = {
  PUBLIC_REGISTER_REASON_REQUIRED:
    'Provide details of why you do not consent to your project information being published',
  PUBLIC_REGISTER_REASON_MAX_LENGTH:
    'Details of why you do not consent must be 1000 characters or less',
  PUBLIC_REGISTER_CONSENT_REQUIRED:
    'Select whether you consent to the MMO publishing your project information publicly'
}

const publicRegisterSettings = {
  pageTitle: 'Sharing your project information publicly',
  heading: 'Sharing your project information publicly'
}

const getBackLink = (request) => {
  const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
  return fromCheckYourAnswers ? routes.CHECK_YOUR_ANSWERS : routes.TASK_LIST
}

export const publicRegisterController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
      ...publicRegisterSettings,
      projectName: exemption.projectName,
      payload: exemption.publicRegister,
      backLink: getBackLink(request)
    })
  }
}
export const publicRegisterSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        consent: joi.string().valid('yes', 'no').required().messages({
          'any.only': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
          'string.empty': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
          'any.required': 'PUBLIC_REGISTER_CONSENT_REQUIRED'
        }),
        reason: joi.when('consent', {
          // Reason required when consent: 'no'
          is: 'no',
          then: joi.string().required().messages({
            'string.empty': 'PUBLIC_REGISTER_REASON_REQUIRED',
            'any.required': 'PUBLIC_REGISTER_REASON_REQUIRED'
          })
        })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        const { projectName } = getExemptionCache(request)
        const backLink = getBackLink(request)

        if (!err.details) {
          return h
            .view(PUBLIC_REGISTER_VIEW_ROUTE, {
              ...publicRegisterSettings,
              payload,
              projectName,
              backLink
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(PUBLIC_REGISTER_VIEW_ROUTE, {
            ...publicRegisterSettings,
            payload,
            projectName,
            backLink,
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

    try {
      // consent: 'yes' = user consents to publish, consent: 'no' = user declines consent
      const userDeclinesConsent = payload.consent === 'no'

      await authenticatedPatchRequest(request, '/exemption/public-register', {
        consent: payload.consent,
        ...(userDeclinesConsent && { reason: payload.reason }),
        id: exemption.id
      })

      await setExemptionCache(request, h, {
        ...exemption,
        publicRegister: {
          consent: payload.consent,
          ...(userDeclinesConsent && { reason: payload.reason })
        }
      })

      return h.redirect(getBackLink(request))
    } catch (e) {
      const validation = e.data?.payload?.validation
      const details = validation?.details

      if (!Array.isArray(details)) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)

      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
        ...publicRegisterSettings,
        payload,
        projectName: exemption.projectName,
        backLink: getBackLink(request),
        errors,
        errorSummary
      })
    }
  }
}
