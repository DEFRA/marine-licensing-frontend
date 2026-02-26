import { routes } from '#src/server/common/constants/routes.js'
import {
  declarationController,
  declarationSubmitController
} from '#src/server/exemption/declaration/controller.js'

export const declarationRoutes = [
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
