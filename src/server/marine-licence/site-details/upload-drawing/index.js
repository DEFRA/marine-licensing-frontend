import { uploadDrawingController } from '#src/server/marine-licence/site-details/upload-drawing/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const uploadDrawingRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_UPLOAD_DRAWING,
    ...uploadDrawingController
  }
]
