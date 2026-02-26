import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { createConfirmFailAction } from '#src/server/defraid-post-login/shared/createConfirmFailAction.js'
import { validateEmployeeUserSession } from '#src/server/common/helpers/user-session-validators.js'
import joi from 'joi'
import {
  generateErrorText,
  generateHeadingText
} from '#src/server/defraid-post-login/confirm-employee/utils.js'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'

export const CONFIRM_EMPLOYEE_VIEW_ROUTE =
  'defraid-post-login/confirm-employee/index'

export const errorMessages = (userSession) => ({
  POST_LOGIN_CONFIRM_EMPLOYEE_CHOICE_REQUIRED: generateErrorText(userSession)
})

export const confirmEmployeeController = {
  options: {
    pre: [validateEmployeeUserSession]
  },
  async handler(request, h) {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    const heading = generateHeadingText(userSession)
    const { organisationName, hasMultipleOrgPickerEntries } = userSession

    const confirmEmployee = await postloginUserSession.get({
      request,
      key: 'confirmEmployee'
    })

    return h.view(CONFIRM_EMPLOYEE_VIEW_ROUTE, {
      backLink: `${routes.CHANGE_ORGANISATION}?skipRedirect=true`,
      heading,
      pageTitle: heading,
      organisationName,
      hasMultipleOrgPickerEntries,
      payload: { confirmEmployee }
    })
  }
}

export const confirmEmployeeSubmitController = {
  options: {
    pre: [validateEmployeeUserSession],
    validate: {
      payload: joi.object({
        confirmEmployee: joi
          .string()
          .valid('yes', 'organisation', 'personal')
          .required()
          .messages({
            'any.only': 'POST_LOGIN_CONFIRM_EMPLOYEE_CHOICE_REQUIRED',
            'string.empty': 'POST_LOGIN_CONFIRM_EMPLOYEE_CHOICE_REQUIRED',
            'any.required': 'POST_LOGIN_CONFIRM_EMPLOYEE_CHOICE_REQUIRED'
          })
      }),
      failAction: createConfirmFailAction({
        viewRoute: CONFIRM_EMPLOYEE_VIEW_ROUTE,
        errorMessages,
        generateHeadingText
      })
    }
  },
  async handler(request, h) {
    const { payload } = request

    const { confirmEmployee } = payload

    await postloginUserSession.set({
      request,
      key: 'confirmEmployee',
      value: confirmEmployee
    })

    if (confirmEmployee === 'personal') {
      return h.redirect(routes.postLogin.GUIDANCE_INDIVIDUAL)
    }

    if (confirmEmployee === 'organisation') {
      return h.redirect(routes.postLogin.GUIDANCE_ORG)
    }

    return h.redirect(routes.PROJECT_NAME)
  }
}
