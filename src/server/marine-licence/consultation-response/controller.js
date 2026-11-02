import Boom from '@hapi/boom'
import {
  apiRoutes,
  routes,
  marineLicenceConsultationDetailsRoutes
} from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { validateConsulteeUserSession } from '#src/server/common/helpers/user-session-validators.js'
import { fetchConsultation } from '#src/server/common/helpers/marine-licence/consultation/fetch-consultation.js'
import { hasResponded } from '#src/server/common/helpers/marine-licence/consultation/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { consultationResponseSchema } from '#src/server/marine-licence/consultation-response/schema.js'

export const CONSULTATION_RESPONSE_VIEW_ROUTE =
  'marine-licence/consultation-response/index'

export const errorMessages = {
  CONSULTATION_RESPONSE_REQUIRED: 'Enter your response to the consultation',
  CONSULTATION_RESPONSE_MAX_LENGTH:
    'Your response to the consultation must be 1000 characters or fewer'
}

const consultationResponseSettings = {
  pageTitle: 'Your response',
  heading: 'Your response'
}

const getConsultationDetailsLink = (marineLicenceId) =>
  marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_CONSULTATION_DETAILS.replace(
    '{marineLicenceId}',
    marineLicenceId
  )

const getConsultation = async (request) => {
  const consultation = await fetchConsultation(
    request,
    request.params.marineLicenceId
  )

  if (!consultation) {
    throw Boom.notFound('Consultation not found')
  }

  return consultation
}

const getViewContext = (request, consultation) => ({
  ...consultationResponseSettings,
  projectName: consultation.projectName,
  backLink: getConsultationDetailsLink(request.params.marineLicenceId)
})

export const consultationResponseController = {
  options: {
    pre: [validateConsulteeUserSession]
  },
  async handler(request, h) {
    const consultation = await getConsultation(request)

    if (hasResponded(consultation)) {
      return h.redirect(routes.CONSULTATIONS)
    }

    return h.view(
      CONSULTATION_RESPONSE_VIEW_ROUTE,
      getViewContext(request, consultation)
    )
  }
}

export const consultationResponseSubmitController = {
  options: {
    pre: [validateConsulteeUserSession],
    validate: {
      payload: consultationResponseSchema,
      failAction: async (request, h, err) => {
        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        return h
          .view(CONSULTATION_RESPONSE_VIEW_ROUTE, {
            ...getViewContext(request, await getConsultation(request)),
            payload: request.payload,
            errors: errorDescriptionByFieldName(errorSummary),
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { marineLicenceId } = request.params

    const consultation = await getConsultation(request)

    if (hasResponded(consultation)) {
      return h.redirect(routes.CONSULTATIONS)
    }

    await authenticatedPatchRequest(
      request,
      apiRoutes.UPDATE_CONSULTATION_REQUEST,
      {
        response: request.payload.consultationResponse,
        id: marineLicenceId
      }
    )

    return h.redirect(routes.CONSULTATIONS)
  }
}
