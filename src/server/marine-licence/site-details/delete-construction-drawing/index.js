import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  deleteConstructionDrawingController,
  deleteConstructionDrawingSubmitController
} from '#src/server/marine-licence/site-details/delete-construction-drawing/controller.js'

export const deleteConstructionDrawingRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE_CONSTRUCTION_DRAWING,
    ...deleteConstructionDrawingController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE_CONSTRUCTION_DRAWING,
    ...deleteConstructionDrawingSubmitController
  }
]
