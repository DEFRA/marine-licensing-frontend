import { routes } from '#src/server/common/constants/routes.js'
import {
  adminExemptionsController,
  adminExemptionsSendController
} from './controller.js'

export const internalUserAdmin = {
  plugin: {
    name: 'internalUserAdmin',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.ADMIN_EXEMPTIONS,
          handler: adminExemptionsController.handler
        },
        {
          method: 'POST',
          path: routes.ADMIN_EXEMPTIONS,
          handler: adminExemptionsSendController.handler
        }
      ])
    }
  }
}
