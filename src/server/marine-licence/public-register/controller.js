import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { publicRegisterSchema } from '#src/server/common/validation/public-register/schema.js'
import {
  publicRegisterErrorMessages,
  publicRegisterSettings
} from '#src/server/common/validation/public-register/constants.js'
import { getCommonRedirectLink } from '#src/server/common/helpers/marine-licence/redirect-link.js'

export const PUBLIC_REGISTER_VIEW_ROUTE = 'templates/public-register'

export const publicRegisterController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
      ...publicRegisterSettings,
      projectName: marineLicence.projectName,
      payload: marineLicence.publicRegister,
      backLink: getCommonRedirectLink(request)
    })
  }
}

export const publicRegisterSubmitController = {
  options: {
    validate: {
      payload: publicRegisterSchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        const backLink = getCommonRedirectLink(request)
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

    const marineLicence = getMarineLicenceCache(request)

    try {
      const userDoesNotConsent = payload.consent === 'no'

      await authenticatedPatchRequest(
        request,
        '/marine-licence/public-register',
        {
          consent: payload.consent,
          ...(userDoesNotConsent && { reason: payload.reason }),
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        publicRegister: {
          consent: payload.consent,
          ...(userDoesNotConsent && { reason: payload.reason })
        }
      })

      return h.redirect(getCommonRedirectLink(request))
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
        projectName: marineLicence.projectName,
        backLink: getCommonRedirectLink(request),
        errors,
        errorSummary
      })
    }
  }
}
