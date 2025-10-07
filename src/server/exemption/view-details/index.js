import { routes } from '#src/server/common/constants/routes.js'
import { viewDetailsController } from '#src/server/exemption/view-details/controller.js'

export const viewDetailsRoutes = [
  {
    method: 'GET',
    path: `${routes.VIEW_DETAILS}/{exemptionId}`,
    ...viewDetailsController
  }
]
