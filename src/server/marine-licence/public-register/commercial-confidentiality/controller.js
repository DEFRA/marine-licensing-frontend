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
  getCommercialConfidentialityAnswers,
  getReasonPageLinks,
  isChangeMode,
  isCommercialConfidentiality
} from '#src/server/marine-licence/public-register/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { WITHHOLD_REASON } from '#src/server/common/validation/marine-licence-public-register/constants.js'

export const PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_VIEW_ROUTE =
  'marine-licence/public-register/commercial-confidentiality/index'

const redirectToPublicRegister = (request, h) =>
  h.redirect(
    withCheckYourAnswersQuery(
      request,
      marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
    )
  )

const canShowPage = (request, publicRegister) =>
  isCommercialConfidentiality(publicRegister) ||
  isChangeMode(request, publicRegister)

export const publicRegisterCommercialConfidentialityController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!canShowPage(request, marineLicence.publicRegister)) {
      return redirectToPublicRegister(request, h)
    }

    return h.view(PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_VIEW_ROUTE, {
      ...marineLicencePublicRegisterCommercialConfidentialitySettings,
      projectName: marineLicence.projectName,
      payload: getCommercialConfidentialityAnswers(
        marineLicence.publicRegister
      ),
      ...getReasonPageLinks(request, marineLicence.publicRegister)
    })
  }
}

export const publicRegisterCommercialConfidentialitySubmitController = {
  options: {
    validate: {
      payload: marineLicencePublicRegisterCommercialConfidentialitySchema,
      failAction: (request, h, err) => {
        const { projectName, publicRegister } = getMarineLicenceCache(request)
        const { backLink, cancelLink } = getReasonPageLinks(
          request,
          publicRegister
        )
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

    if (!canShowPage(request, marineLicence.publicRegister)) {
      return redirectToPublicRegister(request, h)
    }

    try {
      const publicRegister = {
        withholdConsent: 'yes',
        withholdReason: WITHHOLD_REASON.COMMERCIAL_CONFIDENTIALITY,
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
        ...getReasonPageLinks(request, marineLicence.publicRegister),
        errors: errorDescriptionByFieldName(errorSummary),
        errorSummary
      })
    }
  }
}
