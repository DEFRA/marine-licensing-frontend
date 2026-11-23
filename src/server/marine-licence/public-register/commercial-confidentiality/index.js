import {
  publicRegisterCommercialConfidentialityController,
  publicRegisterCommercialConfidentialitySubmitController
} from '#src/server/marine-licence/public-register/commercial-confidentiality/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const publicRegisterCommercialConfidentialityRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY,
    ...publicRegisterCommercialConfidentialityController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY,
    ...publicRegisterCommercialConfidentialitySubmitController
  }
]
