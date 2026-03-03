import { routes } from '#src/server/common/constants/routes.js'
import {
  declarationController,
  declarationSubmitController
} from '#src/server/declaration/controller.js'

const declarationRouteDefinitions = [
  {
    method: 'GET',
    path: routes.DECLARATION,
    ...declarationController
  },
  {
    method: 'POST',
    path: routes.DECLARATION,
    ...declarationSubmitController
  }
]

export const declaration = {
  plugin: {
    name: 'declaration',
    register(server) {
      server.route(declarationRouteDefinitions)
    }
  }
}
