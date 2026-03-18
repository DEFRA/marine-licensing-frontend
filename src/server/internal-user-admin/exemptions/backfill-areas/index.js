import { routes } from '#src/server/common/constants/routes.js'
import {
  adminBackfillController,
  adminBackfillSendController
} from './controller.js'

export const internalBackfillUserAdminRoutes = [
  {
    method: 'GET',
    path: routes.ADMIN_BACKFILL,
    handler: adminBackfillController.handler
  },
  {
    method: 'POST',
    path: routes.ADMIN_BACKFILL,
    handler: adminBackfillSendController.handler
  }
]
