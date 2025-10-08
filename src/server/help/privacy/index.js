import { privacyController } from '#src/server/help/privacy/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
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
