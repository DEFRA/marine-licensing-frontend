import { cookiesController, cookiesSubmitController } from './controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const cookiesRoutes = [
  {
    method: 'GET',
    path: routes.COOKIES,
    ...cookiesController
  },
  {
    method: 'POST',
    path: routes.COOKIES,
    ...cookiesSubmitController
  }
]
