import { routes } from '#src/server/common/constants/routes.js'
import { adminExemptionsController } from './controller.js'

export const internalExemptionLandingUserAdminRoutes = [
  {
    method: 'GET',
    path: routes.ADMIN_EXEMPTIONS,
    ...adminExemptionsController
  }
]
