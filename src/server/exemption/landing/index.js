import { routes } from '#src/server/common/constants/routes.js'
import { exemptionLandingController } from '#src/server/exemption/landing/controller.js'

export const landingRoutes = [
  {
    method: 'GET',
    path: routes.EXEMPTION,
    ...exemptionLandingController
  }
]
