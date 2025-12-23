import { serviceHomeController } from '#src/server/exemption/service-home/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const serviceHomeRoutes = [
  {
    method: 'GET',
    path: routes.SERVICE_HOME,
    ...serviceHomeController
  }
]
