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
  getCheckAnswersLink,
  getPublicRegisterLinks,
  getReasonPage,
  isChangeMode,
  keepReasonAnswers,
  withChangeQuery
} from '#src/server/marine-licence/public-register/utils.js'

export const PUBLIC_REGISTER_VIEW_ROUTE = 'marine-licence/public-register/index'

const isSameWithholdReason = (publicRegister, existing) =>
  publicRegister.withholdConsent === 'yes' &&
  publicRegister.withholdReason === existing.withholdReason

// Nothing is saved here in change mode: the reason page commits the new choice
// with its answers, so Back from there leaves the saved answers untouched
const getChangeModeRedirect = (request, publicRegister, existing) => {
  if (!isChangeMode(request, existing)) {
    return null
  }
  if (isSameWithholdReason(publicRegister, existing)) {
    return getCheckAnswersLink(request)
  }
  const reasonPage = getReasonPage(publicRegister)
  return reasonPage ? withChangeQuery(request, reasonPage) : null
}

export const publicRegisterController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
      ...marineLicencePublicRegisterSettings,
      projectName: marineLicence.projectName,
      payload: marineLicence.publicRegister ?? {},
      ...getPublicRegisterLinks(request, marineLicence.publicRegister)
    })
  }
}

export const publicRegisterSubmitController = {
  options: {
    validate: {
      payload: marineLicencePublicRegisterSchema,
      failAction: (request, h, err) => {
        const { projectName, publicRegister } = getMarineLicenceCache(request)
        const { backLink, cancelLink } = getPublicRegisterLinks(
          request,
          publicRegister
        )
        return createFailAction({
          viewRoute: PUBLIC_REGISTER_VIEW_ROUTE,
          settings: marineLicencePublicRegisterSettings,
          errorMessages: marineLicencePublicRegisterErrorMessages,
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

    const isWithholding = payload.withholdConsent === 'yes'
    const publicRegister = {
      withholdConsent: payload.withholdConsent,
      ...(isWithholding && { withholdReason: payload.withholdReason })
    }

    const changeModeRedirect = getChangeModeRedirect(
      request,
      publicRegister,
      marineLicence.publicRegister
    )
    if (changeModeRedirect) {
      return h.redirect(changeModeRedirect)
    }

    try {
      const reasonPage = getReasonPage(publicRegister)

      // Saved by the reason page instead, so Cancel there discards this choice
      if (!reasonPage) {
        await authenticatedPatchRequest(
          request,
          '/marine-licence/public-register',
          {
            ...publicRegister,
            id: marineLicence.id
          }
        )
      }

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        publicRegister: keepReasonAnswers(
          publicRegister,
          marineLicence.publicRegister
        )
      })

      return h.redirect(
        reasonPage
          ? withCheckYourAnswersQuery(request, reasonPage)
          : getCommonRedirectLink(request)
      )
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
        ...getPublicRegisterLinks(request, marineLicence.publicRegister),
        errors,
        errorSummary
      })
    }
  }
}
