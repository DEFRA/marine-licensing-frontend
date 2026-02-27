import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { validateIndividualUserSession } from '#src/server/common/helpers/user-session-validators.js'
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
  options: {
    pre: [validateIndividualUserSession]
  },
  async handler(request, h) {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    const confirmIndividual = await postloginUserSession.get({
      request,
      key: 'confirmIndividual'
    })

    return h.view(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
      ...viewContent,
      hasMultipleOrgPickerEntries: userSession.hasMultipleOrgPickerEntries,
      backLink: `${routes.CHANGE_ORGANISATION}?skipRedirect=true`,
      heading: generateHeadingText(userSession),
      payload: { confirmIndividual }
    })
  }
}

export const confirmIndividualSubmitController = {
  options: {
    pre: [validateIndividualUserSession],
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
        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
            ...viewContent,
            hasMultipleOrgPickerEntries:
              userSession.hasMultipleOrgPickerEntries,
            backLink: `${routes.CHANGE_ORGANISATION}?skipRedirect=true`,
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

    const { confirmIndividual } = payload

    await postloginUserSession.set({
      request,
      key: 'confirmIndividual',
      value: confirmIndividual
    })

    if (confirmIndividual === 'yes') {
      return h.redirect(routes.PROJECT_NAME)
    }

    return h.redirect(routes.postLogin.GUIDANCE_ORG)
  }
}
