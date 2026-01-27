import { serviceHomeController } from '#src/server/service-home/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const serviceHome = {
  plugin: {
    name: 'service-home',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.SERVICE_HOME,
          ...serviceHomeController
        }
      ])
    }
  }
}
