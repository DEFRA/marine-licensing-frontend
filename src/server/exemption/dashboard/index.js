import { routes } from '#src/server/common/constants/routes.js'
import { dashboardController } from './controller.js'

export const dashboardRoutes = [
  {
    method: 'GET',
    path: routes.DASHBOARD,
    handler: dashboardController.handler
  },
  {
    method: 'POST',
    path: routes.DASHBOARD,
    handler: dashboardController.handler
  }
]
