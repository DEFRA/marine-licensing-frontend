import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { harbourAuthoritySchema } from '#src/server/common/validation/harbour-authority/schema.js'
import {
  harbourAuthorityErrorMessages,
  harbourAuthoritySettings
} from '#src/server/common/validation/harbour-authority/constants.js'

export const HARBOUR_AUTHORITY_VIEW_ROUTE =
  'marine-licence/harbour-authority/index'

const getBackLink = (request) => {
  const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
  return fromCheckYourAnswers
    ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const harbourAuthorityController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(HARBOUR_AUTHORITY_VIEW_ROUTE, {
      ...harbourAuthoritySettings,
      projectName: marineLicence.projectName,
      payload: marineLicence.harbourAuthority,
      backLink: getBackLink(request)
    })
  }
}

export const harbourAuthoritySubmitController = {
  options: {
    validate: {
      payload: harbourAuthoritySchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        const backLink = getBackLink(request)
        return createFailAction({
          viewRoute: HARBOUR_AUTHORITY_VIEW_ROUTE,
          settings: harbourAuthoritySettings,
          errorMessages: harbourAuthorityErrorMessages,
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
      const isInHarbourArea = payload.harbourArea === 'yes'

      await authenticatedPatchRequest(
        request,
        '/marine-licence/harbour-authority',
        {
          harbourArea: payload.harbourArea,
          ...(isInHarbourArea && { details: payload.details }),
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        harbourAuthority: {
          harbourArea: payload.harbourArea,
          ...(isInHarbourArea && { details: payload.details })
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
        harbourAuthorityErrorMessages
      )

      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(HARBOUR_AUTHORITY_VIEW_ROUTE, {
        ...harbourAuthoritySettings,
        payload,
        projectName: marineLicence.projectName,
        backLink: getBackLink(request),
        errors,
        errorSummary
      })
    }
  }
}
