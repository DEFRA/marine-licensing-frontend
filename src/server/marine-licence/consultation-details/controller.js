import Boom from '@hapi/boom'
import {
  marineLicenceConsultationDetailsRoutes,
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { validateConsulteeUserSession } from '#src/server/common/helpers/user-session-validators.js'
import { fetchConsultation } from '#src/server/common/helpers/marine-licence/consultation/fetch-consultation.js'
import { hasResponded } from '#src/server/common/helpers/marine-licence/consultation/utils.js'

export const notificationOfApplicationViewRoute =
  'marine-licence/consultation-details/notification-of-application/index'

export const requestForAdviceViewRoute =
  'marine-licence/consultation-details/request-for-advice/index'

const consultationTypeRoutes = {
  APPLICATION_NOTIFICATION:
    marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_NOTIFICATION_OF_APPLICATION,
  REQUEST_FOR_ADVICE:
    marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_REQUEST_FOR_ADVICE
}

export const consultationDetailsController = {
  options: {
    pre: [validateConsulteeUserSession]
  },
  async handler(request, h) {
    const { marineLicenceId } = request.params
    const consultation = await fetchConsultation(request, marineLicenceId)
    const route = consultationTypeRoutes[consultation?.consultationType]

    if (!route) {
      throw Boom.notFound('Consultation not found')
    }

    return h.redirect(route.replace('{marineLicenceId}', marineLicenceId))
  }
}

const createConsultationPageController = (
  consultationType,
  viewRoute,
  heading
) => ({
  options: {
    pre: [validateConsulteeUserSession]
  },
  async handler(request, h) {
    const { marineLicenceId } = request.params
    const consultation = await fetchConsultation(request, marineLicenceId)

    if (consultation?.consultationType !== consultationType) {
      throw Boom.notFound('Consultation not found')
    }

    const { response } = consultation

    return h.view(viewRoute, {
      pageTitle: heading,
      heading,
      marineLicenceId,
      projectName: consultation.projectName,
      hasResponded: hasResponded(consultation),
      consulteeResponse: response,
      viewApplicationLink: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`,
      responseLink:
        marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_CONSULTATION_RESPONSE.replace(
          '{marineLicenceId}',
          marineLicenceId
        ),
      backLink: routes.CONSULTATIONS
    })
  }
})

export const notificationOfApplicationController =
  createConsultationPageController(
    'APPLICATION_NOTIFICATION',
    notificationOfApplicationViewRoute,
    'Notification of a marine licence application'
  )

export const requestForAdviceController = createConsultationPageController(
  'REQUEST_FOR_ADVICE',
  requestForAdviceViewRoute,
  'Request for advice for a marine licence application'
)
