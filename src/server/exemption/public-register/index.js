import {
  publicRegisterController,
  publicRegisterSubmitController
} from '#src/server/exemption/public-register/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const publicRegisterRoutes = [
  {
    method: 'GET',
    path: routes.PUBLIC_REGISTER,
    ...publicRegisterController
  },
  {
    method: 'POST',
    path: routes.PUBLIC_REGISTER,
    ...publicRegisterSubmitController
  }
]
