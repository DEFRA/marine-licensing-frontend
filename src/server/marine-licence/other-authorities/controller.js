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

export const OTHER_AUTHORITIES_VIEW_ROUTE =
  'marine-licence/other-authorities/index'

export const errorMessages = {
  OTHER_AUTHORITIES_AGREE:
    'Select whether you have applied to, or got permission from, any other authorities',
  OTHER_AUTHORITIES_DETAILS_REQUIRED:
    'Provide details of the other authorities',
  OTHER_AUTHORITIES_DETAILS_MAX_LENGTH:
    'Details of the other authorities must be 1000 characters or fewer'
}

const otherAuthoritiesSettings = {
  pageTitle:
    'Have you applied to, or got permission from, any other authorities in relation to this project?',
  heading:
    'Have you applied to, or got permission from, any other authorities in relation to this project?'
}

const getBackLink = (request) => {
  const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
  return fromCheckYourAnswers
    ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const otherAuthoritiesController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(OTHER_AUTHORITIES_VIEW_ROUTE, {
      ...otherAuthoritiesSettings,
      projectName: marineLicence.projectName,
      payload: marineLicence.otherAuthorities,
      backLink: getBackLink(request)
    })
  }
}

export const otherAuthoritiesSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        agree: joi.string().valid('yes', 'no').required().messages({
          'any.only': errorMessages.OTHER_AUTHORITIES_AGREE,
          'string.empty': errorMessages.OTHER_AUTHORITIES_AGREE,
          'any.required': errorMessages.OTHER_AUTHORITIES_AGREE
        }),
        details: joi.when('agree', {
          is: 'yes',
          then: joi.string().max(1000).required().messages({
            'string.empty': errorMessages.OTHER_AUTHORITIES_DETAILS_REQUIRED,
            'any.required': errorMessages.OTHER_AUTHORITIES_DETAILS_REQUIRED,
            'string.max': errorMessages.OTHER_AUTHORITIES_DETAILS_MAX_LENGTH
          })
        })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        const { projectName } = getMarineLicenceCache(request)
        const backLink = getBackLink(request)

        if (!err.details) {
          return h
            .view(OTHER_AUTHORITIES_VIEW_ROUTE, {
              ...otherAuthoritiesSettings,
              payload,
              projectName,
              backLink
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(OTHER_AUTHORITIES_VIEW_ROUTE, {
            ...otherAuthoritiesSettings,
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
        '/marine-licence/other-authorities',
        {
          agree: payload.agree,
          ...(userAgrees && { details: payload.details }),
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        otherAuthorities: {
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

      return h.view(OTHER_AUTHORITIES_VIEW_ROUTE, {
        ...otherAuthoritiesSettings,
        payload,
        projectName: marineLicence.projectName,
        backLink: getBackLink(request),
        errors,
        errorSummary
      })
    }
  }
}
