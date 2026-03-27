import { fileUploadController } from '#src/server/marine-licence/site-details/file-upload/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
export const fileUploadRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD,
    ...fileUploadController
  }
]
