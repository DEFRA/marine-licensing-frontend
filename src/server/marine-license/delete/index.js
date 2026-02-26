import {
  deleteMarineLicenseController,
  deleteMarineLicenseSelectController,
  deleteMarineLicenseSubmitController
} from '#src/server/marine-license/delete/controller.js'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'

export const deleteMarineLicenseRoutes = [
  {
    method: 'GET',
    path: marineLicenseRoutes.MARINE_LICENSE_DELETE,
    ...deleteMarineLicenseController
  },
  {
    method: 'GET',
    path: `${marineLicenseRoutes.MARINE_LICENSE_DELETE}/{marineLicenseId}`,
    ...deleteMarineLicenseSelectController
  },
  {
    method: 'POST',
    path: marineLicenseRoutes.MARINE_LICENSE_DELETE,
    ...deleteMarineLicenseSubmitController
  }
]
