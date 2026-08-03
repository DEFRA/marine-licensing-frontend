import { applicationTransferredController } from '#src/server/marine-licence/application-transferred/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const applicationTransferredRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_TRANSFERRED}/{marineLicenceId}`,
    ...applicationTransferredController
  }
]
