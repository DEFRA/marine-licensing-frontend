import { routes } from '~/src/server/common/constants/routes.js'
import { viewDetailsController } from '~/src/server/exemption/view-details/controller.js'

export const viewExemptionInternalUserRoutes = [
  {
    method: 'GET',
    path: `${routes.VIEW_DETAILS_INTERNAL_USER}/{exemptionId}`,
    ...viewDetailsController
  }
]
