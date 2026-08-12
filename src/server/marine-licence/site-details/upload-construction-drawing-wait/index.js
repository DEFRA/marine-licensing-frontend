import { uploadConstructionDrawingWaitController } from '#src/server/marine-licence/site-details/upload-construction-drawing-wait/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const uploadConstructionDrawingWaitRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING_WAIT,
    ...uploadConstructionDrawingWaitController
  }
]
