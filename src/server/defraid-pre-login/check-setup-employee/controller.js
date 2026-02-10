import joi from 'joi'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'
import { preloginUserSession } from '#src/server/common/helpers/defraid-pre-login/session-cache.js'

const backLink = routes.preLogin.WHO_IS_EXEMPTION_FOR
const title = 'Check you are set up to apply for your organisation'
const viewData = {
  pageTitle: title,
  heading: title,
  backLink
}
export const pathToPageTemplate = 'defraid-pre-login/check-setup-employee/index'
export const errorMessages = {
  CHECK_SETUP_EMPLOYEE_REQUIRED:
    'Select if you have a Defra account for your organisation'
}

export const preLoginCheckSetupEmployeeController = {
  async handler(request, h) {
    const checkSetupEmployee = await preloginUserSession.get({
      request,
      key: 'checkSetupEmployee'
    })
    return h.view(pathToPageTemplate, { ...viewData, checkSetupEmployee })
  }
}

export const preLoginCheckSetupEmployeeSubmitController = {
  options: {
    auth: false,
    validate: {
      payload: joi.object({
        checkSetupEmployee: joi
          .string()
          .valid('yes', 'register-new', 'need-to-be-added')
          .required()
          .messages({
            'any.only': 'CHECK_SETUP_EMPLOYEE_REQUIRED',
            'string.empty': 'CHECK_SETUP_EMPLOYEE_REQUIRED',
            'any.required': 'CHECK_SETUP_EMPLOYEE_REQUIRED'
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request
        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)
        return h
          .view(pathToPageTemplate, {
            ...viewData,
            payload,
            errorMessage: errors.checkSetupEmployee,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const selection = request.payload.checkSetupEmployee
    await preloginUserSession.set({
      request,
      key: 'checkSetupEmployee',
      value: selection
    })
    if (selection === 'yes') {
      return h.redirect(routes.SIGNIN)
    }
    if (selection === 'need-to-be-added') {
      return h.redirect(routes.preLogin.ADD_TO_ORG_ACCOUNT)
    }
    return h.redirect(routes.preLogin.REGISTER_NEW_ORG)
  }
}
