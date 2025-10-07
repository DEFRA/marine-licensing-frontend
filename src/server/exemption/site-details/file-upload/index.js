import { fileUploadController } from '#src/server/exemption/site-details/file-upload/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const fileUploadRoutes = [
  {
    method: 'GET',
    path: routes.FILE_UPLOAD,
    ...fileUploadController
  }
]
