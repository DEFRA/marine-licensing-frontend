import { uploadAndWaitController } from '#src/server/exemption/site-details/upload-and-wait/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const uploadAndWaitRoutes = [
  {
    method: 'GET',
    path: routes.UPLOAD_AND_WAIT,
    ...uploadAndWaitController
  }
]
