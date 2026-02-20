import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { createConfirmFailAction } from '#src/server/defraid-post-login/shared/createConfirmFailAction.js'
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
      backLink: `${routes.CHANGE_ORGANISATION}?skipRedirect=true`,
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
      failAction: createConfirmFailAction({
        viewRoute: CONFIRM_AGENT_VIEW_ROUTE,
        errorMessages,
        generateHeadingText
      })
    }
  },
  async handler(request, h) {
    const { payload } = request

    const { confirmAgent } = payload

    await postloginUserSession.set({
      request,
      key: 'confirmAgent',
      value: confirmAgent
    })

    if (confirmAgent === 'personal') {
      return h.redirect(routes.postLogin.GUIDANCE_INDIVIDUAL)
    }

    if (confirmAgent === 'organisation') {
      return h.redirect(routes.postLogin.GUIDANCE_ORG)
    }

    return h.redirect(routes.PROJECT_NAME)
  }
}
