import { routes } from '#src/server/common/constants/routes.js'
import { viewDetailsController } from '#src/server/exemption/view-details/controller.js'

export const viewExemptionPublicUserRoutes = [
  {
    method: 'GET',
    options: {
      auth: false
    },
    path: `${routes.VIEW_DETAILS_PUBLIC}/{exemptionId}`,
    ...viewDetailsController
  }
]
