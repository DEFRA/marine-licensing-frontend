import {
  deleteMarineLicenseController,
  deleteMarineLicenseSelectController,
  deleteMarineLicenseSubmitController
} from '#src/server/marine-licence/delete/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const deletemarineLicenceRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE,
    ...deleteMarineLicenseController
  },
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_DELETE}/{marineLicenseId}`,
    ...deleteMarineLicenseSelectController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE,
    ...deleteMarineLicenseSubmitController
  }
]
