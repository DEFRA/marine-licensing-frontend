import {
  consultationDetailsController,
  notificationOfApplicationController,
  requestForAdviceController
} from '#src/server/marine-licence/consultation-details/controller.js'
import { marineLicenceConsultationDetailsRoutes } from '#src/server/common/constants/routes.js'

export const consultationDetailsRoutes = [
  {
    method: 'GET',
    path: marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_CONSULTATION_DETAILS,
    ...consultationDetailsController
  },
  {
    method: 'GET',
    path: marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_NOTIFICATION_OF_APPLICATION,
    ...notificationOfApplicationController
  },
  {
    method: 'GET',
    path: marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_REQUEST_FOR_ADVICE,
    ...requestForAdviceController
  }
]
