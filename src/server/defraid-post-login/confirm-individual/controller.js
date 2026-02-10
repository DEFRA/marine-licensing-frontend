import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import joi from 'joi'
import { generateHeadingText } from '#src/server/defraid-post-login/confirm-individual/utils.js'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'

export const CONFIRM_INDIVIDUAL_VIEW_ROUTE =
  'defraid-post-login/confirm-individual/index'

const viewContent = {
  pageTitle: "Confirm you're notifying us as an individual"
}

export const errorMessages = {
  POST_LOGIN_CONFIRM_INDIVIDUAL_CHOICE_REQUIRED:
    'Select whether you are notifying us for yourself'
}

export const confirmIndividualController = {
  async handler(request, h) {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!userSession?.displayName) {
      return h.redirect(routes.SIGNIN)
    }

    const { userRelationshipType } = userSession

    if (userRelationshipType !== 'Citizen') {
      return h.redirect(routes.EXEMPTION)
    }

    return h.view(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
      ...viewContent,
      heading: generateHeadingText(userSession)
    })
  }
}

export const confirmIndividualSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        confirmIndividual: joi.string().valid('yes', 'no').required().messages({
          'any.only': 'POST_LOGIN_CONFIRM_INDIVIDUAL_CHOICE_REQUIRED',
          'string.empty': 'POST_LOGIN_CONFIRM_INDIVIDUAL_CHOICE_REQUIRED',
          'any.required': 'POST_LOGIN_CONFIRM_INDIVIDUAL_CHOICE_REQUIRED'
        })
      }),
      failAction: async (request, h, err) => {
        const { payload } = request

        const userSession = await getUserSession(
          request,
          request.state?.userSession
        )

        if (!userSession?.displayName) {
          return h.redirect(routes.SIGNIN)
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
            ...viewContent,
            heading: generateHeadingText(userSession),
            payload,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!userSession?.displayName) {
      return h.redirect(routes.SIGNIN)
    }

    const { confirmIndividual } = payload

    await postloginUserSession.set({
      request,
      key: 'confirmIndividual',
      value: confirmIndividual
    })

    if (confirmIndividual === 'yes') {
      return h.redirect(routes.PROJECT_NAME)
    }

    return h.view(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
      ...viewContent,
      payload,
      heading: generateHeadingText(userSession)
    })
  }
}
