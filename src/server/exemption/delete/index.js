import {
  deleteExemptionController,
  deleteExemptionSelectController,
  deleteExemptionSubmitController
} from '#src/server/exemption/delete/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const deleteExemptionRoutes = [
  {
    method: 'GET',
    path: routes.DELETE_EXEMPTION,
    ...deleteExemptionController
  },
  {
    method: 'GET',
    path: `${routes.DELETE_EXEMPTION}/{exemptionId}`,
    ...deleteExemptionSelectController
  },
  {
    method: 'POST',
    path: routes.DELETE_EXEMPTION,
    ...deleteExemptionSubmitController
  }
]
