import { routes } from '#src/server/common/constants/routes.js'
import { adminEmpController, adminEmpSendController } from './controller.js'

export const internalEmpUserAdminRoutes = [
  {
    method: 'GET',
    path: routes.ADMIN_EMP,
    ...adminEmpController
  },
  {
    method: 'POST',
    path: routes.ADMIN_EMP,
    ...adminEmpSendController
  }
]
