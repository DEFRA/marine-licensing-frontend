import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { viewDetailsController } from '#src/server/marine-licence/view-details/controller.js'

export const viewMarineLicencePublicUserRoutes = [
  {
    method: 'GET',
    options: {
      auth: false
    },
    path: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_PUBLIC}/{marineLicenceId}`,
    ...viewDetailsController
  }
]
