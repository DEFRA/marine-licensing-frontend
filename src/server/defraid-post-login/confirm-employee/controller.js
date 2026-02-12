import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
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

    return h.view(CONFIRM_EMPLOYEE_VIEW_ROUTE, {
      heading,
      pageTitle: heading,
      organisationName,
      hasMultipleOrgPickerEntries
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
          .view(CONFIRM_EMPLOYEE_VIEW_ROUTE, {
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

    const { confirmEmployee } = payload

    await postloginUserSession.set({
      request,
      key: 'confirmEmployee',
      value: confirmEmployee
    })

    if (confirmEmployee === 'yes') {
      return h.redirect(routes.PROJECT_NAME)
    }

    const heading = generateHeadingText(userSession)
    const { organisationName, hasMultipleOrgPickerEntries } = userSession

    return h.view(CONFIRM_EMPLOYEE_VIEW_ROUTE, {
      payload,
      heading,
      pageTitle: heading,
      organisationName,
      hasMultipleOrgPickerEntries
    })
  }
}
