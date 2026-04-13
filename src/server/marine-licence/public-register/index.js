import {
  publicRegisterController,
  publicRegisterSubmitController
} from '#src/server/marine-licence/public-register/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

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
  }
]
