import { uploadCompleteController } from '~/src/server/exemption/site-details/upload-complete/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the upload complete page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const uploadCompleteRoutes = [
  {
    method: 'GET',
    path: routes.UPLOAD_COMPLETE,
    ...uploadCompleteController
  }
]
