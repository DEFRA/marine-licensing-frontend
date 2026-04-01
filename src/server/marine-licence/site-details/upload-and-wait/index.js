import { uploadAndWaitController } from '#src/server/marine-licence/site-details/upload-and-wait/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
export const uploadAndWaitRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_UPLOAD_AND_WAIT,
    ...uploadAndWaitController
  }
]
