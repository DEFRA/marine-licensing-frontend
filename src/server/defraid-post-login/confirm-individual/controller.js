import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import joi from 'joi'

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

    const { displayName, userRelationshipType } = userSession

    if (userRelationshipType !== 'Citizen') {
      return h.redirect(routes.EXEMPTION)
    }

    const heading = `Confirm you're notifying us as ${displayName} for a personal project`

    return h.view(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
      ...viewContent,
      heading,
      displayName
    })
  }
}

export const confirmIndividualSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        confirmIndividual: joi.string().valid('Yes', 'No').required().messages({
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
        const { displayName } = userSession

        const heading = `Confirm you're notifying us as ${displayName} for a personal project`

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
            ...viewContent,
            heading,
            displayName,
            payload,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!userSession?.displayName) {
      return h.redirect(routes.SIGNIN)
    }
    const { displayName, userRelationshipType } = userSession

    if (userRelationshipType !== 'Citizen') {
      return h.redirect(routes.PROJECT_NAME)
    }

    const heading = `Confirm you're notifying us as ${displayName} for a personal project`

    return h.view(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
      ...viewContent,
      heading,
      displayName
    })
  }
}
