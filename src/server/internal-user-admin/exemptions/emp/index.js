import { routes } from '#src/server/common/constants/routes.js'
import { adminEmpController, adminEmpSendController } from './controller.js'

export const internalEmpUserAdminRoutes = [
  {
    method: 'GET',
    path: routes.ADMIN_EXEMPTIONS,
    ...adminEmpController
  },
  {
    method: 'POST',
    path: routes.ADMIN_EXEMPTIONS,
    ...adminEmpSendController
  }
]
