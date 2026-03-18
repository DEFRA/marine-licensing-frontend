import { routes } from '#src/server/common/constants/routes.js'
import {
  adminExemptionsController,
  adminExemptionsSendController
} from './controller.js'

export const internalUserAdminRoutes = [
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
]
