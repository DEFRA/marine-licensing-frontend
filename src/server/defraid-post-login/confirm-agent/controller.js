import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { validateAgentUserSession } from '#src/server/common/helpers/user-session-validators.js'
import joi from 'joi'
import {
  generateErrorText,
  generateHeadingText
} from '#src/server/defraid-post-login/confirm-agent/utils.js'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'

export const CONFIRM_AGENT_VIEW_ROUTE = 'defraid-post-login/confirm-agent/index'

export const errorMessages = (userSession) => ({
  POST_LOGIN_CONFIRM_AGENT_CHOICE_REQUIRED: generateErrorText(userSession)
})

export const confirmAgentController = {
  options: {
    pre: [validateAgentUserSession]
  },
  async handler(request, h) {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    const heading = generateHeadingText(userSession)
    const { organisationName, hasMultipleOrgPickerEntries } = userSession

    const confirmAgent = await postloginUserSession.get({
      request,
      key: 'confirmAgent'
    })

    return h.view(CONFIRM_AGENT_VIEW_ROUTE, {
      heading,
      pageTitle: heading,
      organisationName,
      hasMultipleOrgPickerEntries,
      payload: { confirmAgent }
    })
  }
}

export const confirmAgentSubmitController = {
  options: {
    pre: [validateAgentUserSession],
    validate: {
      payload: joi.object({
        confirmAgent: joi
          .string()
          .valid('yes', 'organisation', 'personal')
          .required()
          .messages({
            'any.only': 'POST_LOGIN_CONFIRM_AGENT_CHOICE_REQUIRED',
            'string.empty': 'POST_LOGIN_CONFIRM_AGENT_CHOICE_REQUIRED',
            'any.required': 'POST_LOGIN_CONFIRM_AGENT_CHOICE_REQUIRED'
          })
      }),
      failAction: async (request, h, err) => {
        const { payload } = request
        const userSession = await getUserSession(
          request,
          request.state?.userSession
        )
        const errorSummary = mapErrorsForDisplay(
          err.details,
          errorMessages(userSession)
        )

        const errors = errorDescriptionByFieldName(errorSummary)

        const heading = generateHeadingText(userSession)
        const { organisationName, hasMultipleOrgPickerEntries } = userSession

        return h
          .view(CONFIRM_AGENT_VIEW_ROUTE, {
            heading,
            pageTitle: heading,
            payload,
            organisationName,
            hasMultipleOrgPickerEntries,
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

    const { confirmAgent } = payload

    await postloginUserSession.set({
      request,
      key: 'confirmAgent',
      value: confirmAgent
    })

    if (confirmAgent === 'yes') {
      return h.redirect(routes.PROJECT_NAME)
    }

    if (confirmAgent === 'personal') {
      return h.redirect(routes.postLogin.GUIDANCE_INDIVIDUAL)
    }

    const heading = generateHeadingText(userSession)
    const { organisationName, hasMultipleOrgPickerEntries } = userSession

    return h.view(CONFIRM_AGENT_VIEW_ROUTE, {
      payload,
      heading,
      pageTitle: heading,
      organisationName,
      hasMultipleOrgPickerEntries
    })
  }
}
