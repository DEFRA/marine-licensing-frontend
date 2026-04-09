import {
  getExemptionCache,
  setExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { publicRegisterErrorMessages } from '#src/server/common/constants/form-validation-error-messages.js'

import joi from 'joi'

export const PUBLIC_REGISTER_VIEW_ROUTE = 'templates/public-register'

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
          'any.only':
            publicRegisterErrorMessages.PUBLIC_REGISTER_CONSENT_REQUIRED,
          'string.empty':
            publicRegisterErrorMessages.PUBLIC_REGISTER_CONSENT_REQUIRED,
          'any.required':
            publicRegisterErrorMessages.PUBLIC_REGISTER_CONSENT_REQUIRED
        }),
        reason: joi.when('consent', {
          is: 'no',
          then: joi.string().trim().max(1000).required().messages({
            'string.empty':
              publicRegisterErrorMessages.PUBLIC_REGISTER_REASON_REQUIRED,
            'any.required':
              publicRegisterErrorMessages.PUBLIC_REGISTER_REASON_REQUIRED,
            'string.max':
              publicRegisterErrorMessages.PUBLIC_REGISTER_REASON_MAX_LENGTH
          })
        })
      }),
      failAction: createFailAction({
        getCache: getExemptionCache,
        viewRoute: PUBLIC_REGISTER_VIEW_ROUTE,
        settings: publicRegisterSettings,
        publicRegisterErrorMessages,
        getBackLink
      })
    }
  },
  async handler(request, h) {
    const { payload } = request

    const exemption = getExemptionCache(request)

    try {
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

      const errorSummary = mapErrorsForDisplay(
        details,
        publicRegisterErrorMessages
      )

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
