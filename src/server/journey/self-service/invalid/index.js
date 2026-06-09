import { invalidController } from '#src/server/journey/self-service/invalid/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const journeySelfServiceInvalid = {
  plugin: {
    name: 'journeySelfServiceInvalid',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.IAT_INVALID,
          options: { auth: false },
          ...invalidController
        }
      ])
    }
  }
}
