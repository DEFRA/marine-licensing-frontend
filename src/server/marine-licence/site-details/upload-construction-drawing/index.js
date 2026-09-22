import { uploadConstructionDrawingController } from '#src/server/marine-licence/site-details/upload-construction-drawing/controller.js'
import { uploadConstructionDrawingEntraUserController } from '#src/server/marine-licence/site-details/upload-construction-drawing/entra-user-controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const uploadConstructionDrawingRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING,
    ...uploadConstructionDrawingController
  },
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_REDACTION_UPLOAD_CONSTRUCTION_DRAWING,
    ...uploadConstructionDrawingEntraUserController
  }
]
