import joi from 'joi'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'
import { defraIdGuidanceUserSession } from '#src/server/common/helpers/defraid-guidance/session-cache.js'

const backLink = routes.defraIdGuidance.WHO_IS_EXEMPTION_FOR
const title = 'Check you are set up to apply for your client'
const viewData = {
  pageTitle: title,
  heading: title,
  backLink
}
export const pathToPageTemplate = 'defraid-guidance/check-setup-client/index'
export const errorMessages = {
  CHECK_SETUP_CLIENT_REQUIRED:
    'Select whether your client has fully linked you to their Defra account'
}

export const defraIdGuidanceCheckSetupClientController = {
  async handler(request, h) {
    const checkSetupClient = await defraIdGuidanceUserSession.get({
      request,
      key: 'checkSetupClient'
    })
    return h.view(pathToPageTemplate, { ...viewData, checkSetupClient })
  }
}

export const defraIdGuidanceCheckSetupClientSubmitController = {
  options: {
    auth: false,
    validate: {
      payload: joi.object({
        checkSetupClient: joi.string().valid('yes', 'no').required().messages({
          'any.only': 'CHECK_SETUP_CLIENT_REQUIRED',
          'string.empty': 'CHECK_SETUP_CLIENT_REQUIRED',
          'any.required': 'CHECK_SETUP_CLIENT_REQUIRED'
        })
      }),
      failAction: (request, h, err) => {
        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)
        return h
          .view(pathToPageTemplate, {
            ...viewData,
            checkSetupClient: request.payload?.checkSetupClient,
            errorMessage: errors.checkSetupClient,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const selection = request.payload.checkSetupClient
    await defraIdGuidanceUserSession.set({
      request,
      key: 'checkSetupClient',
      value: selection
    })
    if (selection === 'yes') {
      return h.redirect(routes.SIGNIN)
    }
    return h.redirect(routes.defraIdGuidance.CHECK_SETUP_CLIENT)
  }
}
