import { fileUploadController } from '~/src/server/exemption/site-details/file-upload/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the file upload page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const fileUploadRoutes = [
  {
    method: 'GET',
    path: routes.FILE_UPLOAD,
    ...fileUploadController
  }
]
