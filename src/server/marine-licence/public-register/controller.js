import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { createMarineLicenceFailAction } from '#src/server/common/helpers/marine-licence/createMarineLicenceFailAction.js'

import joi from 'joi'

export const PUBLIC_REGISTER_VIEW_ROUTE = 'templates/public-register'

export const errorMessages = {
  PUBLIC_REGISTER_CONSENT_REQUIRED:
    'Select whether there is any reason why your information cannot be shared publicly',
  PUBLIC_REGISTER_REASON_REQUIRED: 'Provide details of why you do not consent',
  PUBLIC_REGISTER_REASON_MAX_LENGTH:
    'Details of why you do not consent must be 1000 characters or fewer'
}

const publicRegisterSettings = {
  pageTitle: 'Sharing your project information publicly',
  heading: 'Sharing your project information publicly'
}

const getBackLink = (request) => {
  const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
  return fromCheckYourAnswers
    ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const publicRegisterController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
      ...publicRegisterSettings,
      projectName: marineLicence.projectName,
      payload: marineLicence.publicRegister,
      backLink: getBackLink(request)
    })
  }
}

export const publicRegisterSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        consent: joi.string().valid('yes', 'no').required().messages({
          'any.only': errorMessages.PUBLIC_REGISTER_CONSENT_REQUIRED,
          'string.empty': errorMessages.PUBLIC_REGISTER_CONSENT_REQUIRED,
          'any.required': errorMessages.PUBLIC_REGISTER_CONSENT_REQUIRED
        }),
        reason: joi.when('consent', {
          is: 'no',
          then: joi.string().trim().max(1000).required().messages({
            'string.empty': errorMessages.PUBLIC_REGISTER_REASON_REQUIRED,
            'any.required': errorMessages.PUBLIC_REGISTER_REASON_REQUIRED,
            'string.max': errorMessages.PUBLIC_REGISTER_REASON_MAX_LENGTH
          })
        })
      }),
      failAction: createMarineLicenceFailAction({
        viewRoute: PUBLIC_REGISTER_VIEW_ROUTE,
        settings: publicRegisterSettings,
        errorMessages,
        getBackLink
      })
    }
  },
  async handler(request, h) {
    const { payload } = request

    const marineLicence = getMarineLicenceCache(request)

    try {
      const userDoesNotConsent = payload.consent === 'no'

      await authenticatedPatchRequest(
        request,
        '/marine-licence/public-register',
        {
          consent: payload.consent,
          ...(userDoesNotConsent && { reason: payload.reason }),
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        publicRegister: {
          consent: payload.consent,
          ...(userDoesNotConsent && { reason: payload.reason })
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
        projectName: marineLicence.projectName,
        backLink: getBackLink(request),
        errors,
        errorSummary
      })
    }
  }
}
