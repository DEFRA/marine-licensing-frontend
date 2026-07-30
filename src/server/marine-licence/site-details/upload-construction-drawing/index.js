import { uploadConstructionDrawingController } from '#src/server/marine-licence/site-details/upload-construction-drawing/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const uploadConstructionDrawingRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING,
    ...uploadConstructionDrawingController
  }
]
