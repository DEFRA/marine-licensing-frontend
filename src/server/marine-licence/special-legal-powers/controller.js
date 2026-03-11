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

export const SPECIAL_LEGAL_POWERS_VIEW_ROUTE =
  'marine-licence/special-legal-powers/index'

export const errorMessages = {
  SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED: 'Provide details of the legal powers',
  SPECIAL_LEGAL_POWERS_DETAILS_MAX_LENGTH:
    'Details of the legal powers must be 1000 characters or fewer',
  SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED:
    'Select whether your organisation has special legal powers'
}

const specialLegalPowersSettings = {
  pageTitle:
    'Does your organisation have special legal powers to do any of this project?',
  heading:
    'Does your organisation have special legal powers to do any of this project?'
}

const getBackLink = (request) => {
  const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
  return fromCheckYourAnswers
    ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const specialLegalPowersController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(SPECIAL_LEGAL_POWERS_VIEW_ROUTE, {
      ...specialLegalPowersSettings,
      projectName: marineLicence.projectName,
      payload: marineLicence.specialLegalPowers,
      backLink: getBackLink(request)
    })
  }
}
export const specialLegalPowersSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        consent: joi.string().valid('yes', 'no').required().messages({
          'any.only': 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED',
          'string.empty': 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED',
          'any.required': 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED'
        }),
        reason: joi.when('consent', {
          // Reason required when consent: 'no'
          is: 'no',
          then: joi.string().required().messages({
            'string.empty': 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED',
            'any.required': 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED'
          })
        })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        const { projectName } = getMarineLicenceCache(request)
        const backLink = getBackLink(request)

        if (!err.details) {
          return h
            .view(SPECIAL_LEGAL_POWERS_VIEW_ROUTE, {
              ...specialLegalPowersSettings,
              payload,
              projectName,
              backLink
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(SPECIAL_LEGAL_POWERS_VIEW_ROUTE, {
            ...specialLegalPowersSettings,
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
      // consent: 'yes' = user consents to publish, consent: 'no' = user declines consent
      const userDeclinesConsent = payload.consent === 'no'

      await authenticatedPatchRequest(
        request,
        '/marine-licence/special-legal-powers',
        {
          consent: payload.consent,
          ...(userDeclinesConsent && { reason: payload.reason }),
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        specialLegalPowers: {
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

      return h.view(SPECIAL_LEGAL_POWERS_VIEW_ROUTE, {
        ...specialLegalPowersSettings,
        payload,
        projectName: marineLicence.projectName,
        backLink: getBackLink(request),
        errors,
        errorSummary
      })
    }
  }
}
