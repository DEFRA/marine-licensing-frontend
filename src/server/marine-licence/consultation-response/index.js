import {
  consultationResponseController,
  consultationResponseSubmitController
} from '#src/server/marine-licence/consultation-response/controller.js'
import { marineLicenceConsultationDetailsRoutes } from '#src/server/common/constants/routes.js'

export const consultationResponseRoutes = [
  {
    method: 'GET',
    path: marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_CONSULTATION_RESPONSE,
    ...consultationResponseController
  },
  {
    method: 'POST',
    path: marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_CONSULTATION_RESPONSE,
    ...consultationResponseSubmitController
  }
]
