import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { viewDetailsController } from '#src/server/marine-licence/view-details/controller.js'

export const viewMarineLicenceInternalUserRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/{marineLicenceId}`,
    ...viewDetailsController
  }
]
