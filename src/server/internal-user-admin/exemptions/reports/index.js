import { routes } from '#src/server/common/constants/routes.js'
import { adminReportsController } from './controller.js'

export const internalReportsUserAdminRoutes = [
  {
    method: 'GET',
    path: routes.ADMIN_REPORTS,
    ...adminReportsController
  }
]
