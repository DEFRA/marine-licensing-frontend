import { cookiesController, cookiesSubmitController } from './controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the cookies page.
 * @satisfies {Array<ServerRoute>}
 */
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

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
