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
import { publicConsultationSchema } from '#src/server/common/validation/public-consultation/schema.js'
import {
  publicConsultationErrorMessages,
  publicConsultationSettings
} from '#src/server/common/validation/public-consultation/constants.js'

export const PUBLIC_CONSULTATION_VIEW_ROUTE =
  'marine-licence/public-consultation/index'

const getBackLink = (request) => {
  const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
  return fromCheckYourAnswers
    ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const publicConsultationController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(PUBLIC_CONSULTATION_VIEW_ROUTE, {
      ...publicConsultationSettings,
      projectName: marineLicence.projectName,
      payload: marineLicence.publicConsultation,
      backLink: getBackLink(request)
    })
  }
}

export const publicConsultationSubmitController = {
  options: {
    validate: {
      payload: publicConsultationSchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        const backLink = getBackLink(request)
        return createFailAction({
          viewRoute: PUBLIC_CONSULTATION_VIEW_ROUTE,
          settings: publicConsultationSettings,
          errorMessages: publicConsultationErrorMessages,
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
      const isConsulted = payload.consulted === 'yes'

      await authenticatedPatchRequest(
        request,
        '/marine-licence/public-consultation',
        {
          consulted: payload.consulted,
          ...(isConsulted && { details: payload.details }),
          id: marineLicence.id
        }
      )

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        publicConsultation: {
          consulted: payload.consulted,
          ...(isConsulted && { details: payload.details })
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
        publicConsultationErrorMessages
      )

      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(PUBLIC_CONSULTATION_VIEW_ROUTE, {
        ...publicConsultationSettings,
        payload,
        projectName: marineLicence.projectName,
        backLink: getBackLink(request),
        errors,
        errorSummary
      })
    }
  }
}
