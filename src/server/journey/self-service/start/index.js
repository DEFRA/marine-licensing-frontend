import {
  iatStartController,
  iatStartPostController
} from '#src/server/journey/self-service/start/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const journeySelfServiceStart = {
  plugin: {
    name: 'journeySelfServiceStart',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.IAT_START,
          options: {
            auth: false
          },
          ...iatStartController
        },
        {
          method: 'POST',
          path: routes.IAT_START,
          options: {
            auth: false
          },
          ...iatStartPostController
        }
      ])
    }
  }
}
