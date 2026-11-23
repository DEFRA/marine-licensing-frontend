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
import { marineLicencePublicRegisterNationalSecuritySchema } from '#src/server/common/validation/marine-licence-public-register-national-security/schema.js'
import {
  marineLicencePublicRegisterNationalSecurityErrorMessages,
  marineLicencePublicRegisterNationalSecuritySettings
} from '#src/server/common/validation/marine-licence-public-register-national-security/constants.js'
import { withCheckYourAnswersQuery } from '#src/server/common/helpers/marine-licence/redirect-link.js'
import {
  getNationalSecurityAnswers,
  getPublicRegisterLink,
  getReasonPageLinks,
  isChangeMode,
  isNationalSecurity
} from '#src/server/marine-licence/public-register/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { WITHHOLD_REASON } from '#src/server/common/validation/marine-licence-public-register/constants.js'

export const PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE =
  'marine-licence/public-register/national-security/index'

const canShowPage = (request, publicRegister) =>
  isNationalSecurity(publicRegister) || isChangeMode(request, publicRegister)

export const publicRegisterNationalSecurityController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!canShowPage(request, marineLicence.publicRegister)) {
      return h.redirect(getPublicRegisterLink(request))
    }

    return h.view(PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE, {
      ...marineLicencePublicRegisterNationalSecuritySettings,
      projectName: marineLicence.projectName,
      payload: getNationalSecurityAnswers(marineLicence.publicRegister),
      ...getReasonPageLinks(request, marineLicence.publicRegister)
    })
  }
}

export const publicRegisterNationalSecuritySubmitController = {
  options: {
    validate: {
      payload: marineLicencePublicRegisterNationalSecuritySchema,
      failAction: (request, h, err) => {
        const { projectName, publicRegister } = getMarineLicenceCache(request)
        const { backLink, cancelLink } = getReasonPageLinks(
          request,
          publicRegister
        )
        return createFailAction({
          viewRoute: PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE,
          settings: marineLicencePublicRegisterNationalSecuritySettings,
          errorMessages:
            marineLicencePublicRegisterNationalSecurityErrorMessages,
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
      return h.redirect(getPublicRegisterLink(request))
    }

    try {
      const answers = {
        nationalSecurityApproval: payload.nationalSecurityApproval,
        ...(payload.nationalSecurityApproval === 'yes' && {
          reason: payload.reason
        })
      }

      const publicRegister = {
        withholdConsent: 'yes',
        withholdReason: WITHHOLD_REASON.NATIONAL_SECURITY,
        ...answers
      }

      await authenticatedPatchRequest(
        request,
        '/marine-licence/public-register-national-security',
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
        marineLicencePublicRegisterNationalSecurityErrorMessages
      )

      return h.view(PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE, {
        ...marineLicencePublicRegisterNationalSecuritySettings,
        payload,
        projectName: marineLicence.projectName,
        ...getReasonPageLinks(request, marineLicence.publicRegister),
        errors: errorDescriptionByFieldName(errorSummary),
        errorSummary
      })
    }
  }
}
