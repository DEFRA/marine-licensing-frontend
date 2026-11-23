import {
  publicRegisterCheckAnswersController,
  publicRegisterCheckAnswersSubmitController
} from '#src/server/marine-licence/public-register-check-answers/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const publicRegisterCheckAnswersRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_CHECK_ANSWERS,
    ...publicRegisterCheckAnswersController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_CHECK_ANSWERS,
    ...publicRegisterCheckAnswersSubmitController
  }
]
