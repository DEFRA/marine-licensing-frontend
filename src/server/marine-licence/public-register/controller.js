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
import { marineLicencePublicRegisterSchema } from '#src/server/common/validation/marine-licence-public-register/schema.js'
import {
  marineLicencePublicRegisterErrorMessages,
  marineLicencePublicRegisterSettings
} from '#src/server/common/validation/marine-licence-public-register/constants.js'
import {
  getCommonRedirectLink,
  withCheckYourAnswersQuery
} from '#src/server/common/helpers/marine-licence/redirect-link.js'
import {
  getNationalSecurityAnswers,
  isNationalSecurity
} from '#src/server/common/helpers/marine-licence/public-register.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const PUBLIC_REGISTER_VIEW_ROUTE = 'marine-licence/public-register/index'

const keepNationalSecurityAnswers = (publicRegister, existing) => {
  if (!isNationalSecurity(publicRegister) || !isNationalSecurity(existing)) {
    return publicRegister
  }
  const { nationalSecurityApproval, reason } =
    getNationalSecurityAnswers(existing)
  return {
    ...publicRegister,
    ...(nationalSecurityApproval && { nationalSecurityApproval }),
    ...(reason && { reason })
  }
}

const getNextPage = (request, publicRegister) =>
  isNationalSecurity(publicRegister)
    ? withCheckYourAnswersQuery(
        request,
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
      )
    : getCommonRedirectLink(request)

export const publicRegisterController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
      ...marineLicencePublicRegisterSettings,
      projectName: marineLicence.projectName,
      payload: marineLicence.publicRegister ?? {},
      backLink: getCommonRedirectLink(request)
    })
  }
}

export const publicRegisterSubmitController = {
  options: {
    validate: {
      payload: marineLicencePublicRegisterSchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        const backLink = getCommonRedirectLink(request)
        return createFailAction({
          viewRoute: PUBLIC_REGISTER_VIEW_ROUTE,
          settings: marineLicencePublicRegisterSettings,
          errorMessages: marineLicencePublicRegisterErrorMessages,
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
      const isWithholding = payload.withholdConsent === 'yes'
      const publicRegister = {
        withholdConsent: payload.withholdConsent,
        ...(isWithholding && { withholdReason: payload.withholdReason })
      }

      await authenticatedPatchRequest(
        request,
        '/marine-licence/public-register',
        {
          ...publicRegister,
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        publicRegister: keepNationalSecurityAnswers(
          publicRegister,
          marineLicence.publicRegister
        )
      })

      return h.redirect(getNextPage(request, publicRegister))
    } catch (e) {
      const validation = e.data?.payload?.validation
      const details = validation?.details

      if (!Array.isArray(details)) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(
        details,
        marineLicencePublicRegisterErrorMessages
      )

      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
        ...marineLicencePublicRegisterSettings,
        payload,
        projectName: marineLicence.projectName,
        backLink: getCommonRedirectLink(request),
        errors,
        errorSummary
      })
    }
  }
}
