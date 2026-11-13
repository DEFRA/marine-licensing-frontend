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
import {
  getCommonRedirectLink,
  withCheckYourAnswersQuery
} from '#src/server/common/helpers/marine-licence/redirect-link.js'
import {
  getNationalSecurityAnswers,
  isNationalSecurity
} from '#src/server/common/helpers/marine-licence/public-register.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE =
  'marine-licence/public-register-national-security/index'

const getPublicRegisterLink = (request) =>
  withCheckYourAnswersQuery(
    request,
    marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
  )

const getLinks = (request) => ({
  backLink: getPublicRegisterLink(request),
  cancelLink: getCommonRedirectLink(request)
})

const withAnswers = (publicRegister, answers) => ({
  withholdConsent: publicRegister?.withholdConsent,
  withholdReason: publicRegister?.withholdReason,
  ...answers
})

export const publicRegisterNationalSecurityController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    if (!isNationalSecurity(marineLicence.publicRegister)) {
      return h.redirect(getPublicRegisterLink(request))
    }

    return h.view(PUBLIC_REGISTER_NATIONAL_SECURITY_VIEW_ROUTE, {
      ...marineLicencePublicRegisterNationalSecuritySettings,
      projectName: marineLicence.projectName,
      payload: getNationalSecurityAnswers(marineLicence.publicRegister),
      ...getLinks(request)
    })
  }
}

export const publicRegisterNationalSecuritySubmitController = {
  options: {
    validate: {
      payload: marineLicencePublicRegisterNationalSecuritySchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        const { backLink, cancelLink } = getLinks(request)
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

    if (!isNationalSecurity(marineLicence.publicRegister)) {
      return h.redirect(getPublicRegisterLink(request))
    }

    try {
      const answers = {
        nationalSecurityApproval: payload.nationalSecurityApproval,
        ...(payload.nationalSecurityApproval === 'yes' && {
          reason: payload.reason
        })
      }

      await authenticatedPatchRequest(
        request,
        '/marine-licence/public-register/national-security',
        { ...answers, id: marineLicence.id }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        publicRegister: withAnswers(marineLicence.publicRegister, answers)
      })

      return h.redirect(
        withCheckYourAnswersQuery(
          request,
          marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
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
        ...getLinks(request),
        errors: errorDescriptionByFieldName(errorSummary),
        errorSummary
      })
    }
  }
}
