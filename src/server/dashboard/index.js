import { routes } from '#src/server/common/constants/routes.js'
import { dashboardController, dashboardPostController } from './controller.js'

export const dashboardRoutes = [
  {
    method: 'GET',
    path: routes.DASHBOARD,
    ...dashboardController
  },
  {
    method: 'POST',
    path: routes.DASHBOARD,
    ...dashboardPostController
  }
]
