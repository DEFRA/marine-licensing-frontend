import {
  deleteMarineLicenceController,
  deleteMarineLicenceSelectController,
  deleteMarineLicenceSubmitController
} from '#src/server/marine-licence/delete/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const deleteMarineLicenceRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE,
    ...deleteMarineLicenceController
  },
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_DELETE}/{marineLicenceId}`,
    ...deleteMarineLicenceSelectController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE,
    ...deleteMarineLicenceSubmitController
  }
]
