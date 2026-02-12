import {
  confirmEmployeeController,
  confirmEmployeeSubmitController
} from '#src/server/defraid-post-login/confirm-employee/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const confirmEmployeeRoutes = [
  {
    method: 'GET',
    path: routes.postLogin.CONFIRM_EMPLOYEE,
    ...confirmEmployeeController
  },
  {
    method: 'POST',
    path: routes.postLogin.CONFIRM_EMPLOYEE,
    ...confirmEmployeeSubmitController
  }
]
