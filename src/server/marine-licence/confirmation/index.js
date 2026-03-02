import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { confirmationController } from '#src/server/marine-licence/confirmation/controller.js'

export const confirmationRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION,
    ...confirmationController
  }
]
