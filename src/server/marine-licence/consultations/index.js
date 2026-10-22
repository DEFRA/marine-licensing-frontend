import { routes } from '#src/server/common/constants/routes.js'
import { consultationsController } from './controller.js'

export const consultationsRoutes = [
  {
    method: 'GET',
    path: routes.CONSULTATIONS,
    ...consultationsController
  }
]
