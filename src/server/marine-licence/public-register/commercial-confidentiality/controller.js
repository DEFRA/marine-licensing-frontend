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
import { marineLicencePublicRegisterCommercialConfidentialitySchema } from '#src/server/common/validation/marine-licence-public-register-commercial-confidentiality/schema.js'
import {
  marineLicencePublicRegisterCommercialConfidentialityErrorMessages,
  marineLicencePublicRegisterCommercialConfidentialitySettings
} from '#src/server/common/validation/marine-licence-public-register-commercial-confidentiality/constants.js'
import { withCheckYourAnswersQuery } from '#src/server/common/helpers/marine-licence/redirect-link.js'
import {
  getReasonPageLinks,
  isCommercialConfidentiality
} from '#src/server/marine-licence/public-register/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_VIEW_ROUTE =
  'marine-licence/public-register/commercial-confidentiality/index'

const redirectToPublicRegister = (request, h) =>
  h.redirect(getReasonPageLinks(request).backLink)

export const publicRegisterCommercialConfidentialityController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!isCommercialConfidentiality(marineLicence.publicRegister)) {
      return redirectToPublicRegister(request, h)
    }

    return h.view(PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_VIEW_ROUTE, {
      ...marineLicencePublicRegisterCommercialConfidentialitySettings,
      projectName: marineLicence.projectName,
      payload: { reason: marineLicence.publicRegister.reason },
      ...getReasonPageLinks(request)
    })
  }
}

export const publicRegisterCommercialConfidentialitySubmitController = {
  options: {
    validate: {
      payload: marineLicencePublicRegisterCommercialConfidentialitySchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        const { backLink, cancelLink } = getReasonPageLinks(request)
        return createFailAction({
          viewRoute: PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_VIEW_ROUTE,
          settings:
            marineLicencePublicRegisterCommercialConfidentialitySettings,
          errorMessages:
            marineLicencePublicRegisterCommercialConfidentialityErrorMessages,
          projectName,
          backLink,
          payload: request.payload,
          params: { cancelLink }
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)

    if (!isCommercialConfidentiality(marineLicence.publicRegister)) {
      return redirectToPublicRegister(request, h)
    }

    try {
      const { withholdConsent, withholdReason } = marineLicence.publicRegister
      const publicRegister = {
        withholdConsent,
        withholdReason,
        reason: payload.reason
      }

      await authenticatedPatchRequest(
        request,
        '/marine-licence/public-register-commercial-confidentiality',
        { ...publicRegister, id: marineLicence.id }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        publicRegister
      })

      return h.redirect(
        withCheckYourAnswersQuery(
          request,
          marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_CHECK_ANSWERS
        )
      )
    } catch (e) {
      const details = e.data?.payload?.validation?.details

      if (!Array.isArray(details)) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(
        details,
        marineLicencePublicRegisterCommercialConfidentialityErrorMessages
      )

      return h.view(PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_VIEW_ROUTE, {
        ...marineLicencePublicRegisterCommercialConfidentialitySettings,
        payload,
        projectName: marineLicence.projectName,
        ...getReasonPageLinks(request),
        errors: errorDescriptionByFieldName(errorSummary),
        errorSummary
      })
    }
  }
}
