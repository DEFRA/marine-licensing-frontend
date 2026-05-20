import {
  publicConsultationController,
  publicConsultationSubmitController
} from '#src/server/marine-licence/public-consultation/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const publicConsultationRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
    ...publicConsultationController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
    ...publicConsultationSubmitController
  }
]
