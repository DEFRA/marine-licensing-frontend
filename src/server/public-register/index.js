import { publicRegisterBrowseController } from '#src/server/public-register/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const publicRegisterBrowseRoutes = [
  {
    method: 'GET',
    path: routes.PUBLIC_REGISTER_BROWSE,
    ...publicRegisterBrowseController
  }
]

export const publicRegisterBrowse = {
  plugin: {
    name: 'public-register-browse',
    register(server) {
      server.route(publicRegisterBrowseRoutes)
    }
  }
}
