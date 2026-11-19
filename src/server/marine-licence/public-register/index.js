import {
  publicRegisterController,
  publicRegisterSubmitController
} from '#src/server/marine-licence/public-register/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { publicRegisterNationalSecurityRoutes } from '#src/server/marine-licence/public-register/national-security/index.js'
import { publicRegisterCommercialConfidentialityRoutes } from '#src/server/marine-licence/public-register/commercial-confidentiality/index.js'
import { publicRegisterCheckAnswersRoutes } from '#src/server/marine-licence/public-register/check-answers/index.js'

export const publicRegisterRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
    ...publicRegisterController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
    ...publicRegisterSubmitController
  },
  ...publicRegisterNationalSecurityRoutes,
  ...publicRegisterCommercialConfidentialityRoutes,
  ...publicRegisterCheckAnswersRoutes
]
