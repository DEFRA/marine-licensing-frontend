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

import joi from 'joi'

export const PUBLIC_REGISTER_VIEW_ROUTE =
  'marine-licence/public-register/index'

export const errorMessages = {
  PUBLIC_REGISTER_CONSENT_REQUIRED:
    'Select whether you consent to the MMO publishing your project information publicly',
  PUBLIC_REGISTER_DETAILS_REQUIRED:
    'Provide details about what you consent to share',
  PUBLIC_REGISTER_DETAILS_MAX_LENGTH:
    'Details must be 1000 characters or fewer'
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
          'any.only': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
          'string.empty': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
          'any.required': 'PUBLIC_REGISTER_CONSENT_REQUIRED'
        }),
        details: joi.when('consent', {
          is: 'yes',
          then: joi.string().max(1000).required().messages({
            'string.empty': 'PUBLIC_REGISTER_DETAILS_REQUIRED',
            'any.required': 'PUBLIC_REGISTER_DETAILS_REQUIRED',
            'string.max': 'PUBLIC_REGISTER_DETAILS_MAX_LENGTH'
          })
        })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        const { projectName } = getMarineLicenceCache(request)
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

    const marineLicence = getMarineLicenceCache(request)

    try {
      const userConsents = payload.consent === 'yes'

      await authenticatedPatchRequest(
        request,
        '/marine-licence/public-register',
        {
          consent: payload.consent,
          ...(userConsents && { details: payload.details }),
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        publicRegister: {
          consent: payload.consent,
          ...(userConsents && { details: payload.details })
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
