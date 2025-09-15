import { privacyController } from '~/src/server/help/privacy/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the privacy page.
 * @satisfies {Array<ServerRoute>}
 */
export const privacyRoutes = [
  {
    method: 'GET',
    path: routes.PRIVACY,
    options: {
      auth: false
    },
    ...privacyController
  }
]

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
