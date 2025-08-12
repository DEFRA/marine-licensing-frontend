import {
  deleteExemptionController,
  deleteExemptionSelectController,
  deleteExemptionSubmitController
} from '~/src/server/exemption/delete/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the delete exemption page.
 * These routes are registered in src/server/router.js.
 */
/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
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

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
