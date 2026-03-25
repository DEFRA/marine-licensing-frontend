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
import { USER_TYPES } from '#src/server/common/constants/user-types.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'

import joi from 'joi'

export const SPECIAL_LEGAL_POWERS_VIEW_ROUTE =
  'marine-licence/special-legal-powers/index'

export const errorMessages = {
  SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED: 'Provide details of the legal powers',
  SPECIAL_LEGAL_POWERS_DETAILS_MAX_LENGTH:
    'Details of the legal powers must be 1000 characters or fewer',
  SPECIAL_LEGAL_POWERS_DETAILS_AGREE:
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
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    const { userRelationshipType } = userSession

    if (userRelationshipType === USER_TYPES.CITIZEN) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

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
        agree: joi.string().valid('yes', 'no').required().messages({
          'any.only': 'SPECIAL_LEGAL_POWERS_DETAILS_AGREE',
          'string.empty': 'SPECIAL_LEGAL_POWERS_DETAILS_AGREE',
          'any.required': 'SPECIAL_LEGAL_POWERS_DETAILS_AGREE'
        }),
        details: joi.when('agree', {
          // Details required when agree: 'yes'
          is: 'yes',
          then: joi.string().max(1000).required().messages({
            'string.empty': 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED',
            'any.required': 'SPECIAL_LEGAL_POWERS_DETAILS_REQUIRED',
            'string.max': 'SPECIAL_LEGAL_POWERS_DETAILS_MAX_LENGTH'
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
      const userAgrees = payload.agree === 'yes'

      await authenticatedPatchRequest(
        request,
        '/marine-licence/special-legal-powers',
        {
          agree: payload.agree,
          ...(userAgrees && { details: payload.details }),
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        specialLegalPowers: {
          agree: payload.agree,
          ...(userAgrees && { details: payload.details })
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
