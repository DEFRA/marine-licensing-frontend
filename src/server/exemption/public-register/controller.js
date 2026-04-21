import {
  getExemptionCache,
  setExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { publicRegisterSchema } from '#src/server/common/validation/public-register/schema.js'
import {
  publicRegisterErrorMessages,
  publicRegisterSettings
} from '#src/server/common/validation/public-register/constants.js'

export const PUBLIC_REGISTER_VIEW_ROUTE = 'templates/public-register'

const getBackLink = (request) => {
  const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
  return fromCheckYourAnswers ? routes.CHECK_YOUR_ANSWERS : routes.TASK_LIST
}

export const publicRegisterController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
      ...publicRegisterSettings,
      projectName: exemption.projectName,
      payload: exemption.publicRegister,
      backLink: getBackLink(request)
    })
  }
}
export const publicRegisterSubmitController = {
  options: {
    validate: {
      payload: publicRegisterSchema,
      failAction: (request, h, err) => {
        const { projectName } = getExemptionCache(request)
        const backLink = getBackLink(request)
        return createFailAction({
          viewRoute: PUBLIC_REGISTER_VIEW_ROUTE,
          settings: publicRegisterSettings,
          errorMessages: publicRegisterErrorMessages,
          projectName,
          backLink,
          payload: request.payload
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    const exemption = getExemptionCache(request)

    try {
      const userDeclinesConsent = payload.consent === 'no'

      await authenticatedPatchRequest(request, '/exemption/public-register', {
        consent: payload.consent,
        ...(userDeclinesConsent && { reason: payload.reason }),
        id: exemption.id
      })

      await setExemptionCache(request, h, {
        ...exemption,
        publicRegister: {
          consent: payload.consent,
          ...(userDeclinesConsent && { reason: payload.reason })
        }
      })

      return h.redirect(getBackLink(request))
    } catch (e) {
      const validation = e.data?.payload?.validation
      const details = validation?.details

      if (!Array.isArray(details)) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(
        details,
        publicRegisterErrorMessages
      )

      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
        ...publicRegisterSettings,
        payload,
        projectName: exemption.projectName,
        backLink: getBackLink(request),
        errors,
        errorSummary
      })
    }
  }
}
