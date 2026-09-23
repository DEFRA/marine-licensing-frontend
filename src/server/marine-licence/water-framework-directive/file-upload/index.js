import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { waterFrameworkFileUploadController } from '#src/server/marine-licence/water-framework-directive/file-upload/controller.js'
import { waterFrameworkFileUploadEntraUserController } from '#src/server/marine-licence/water-framework-directive/file-upload/entra-user-controller.js'

export const waterFrameworkFileUploadRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD,
    ...waterFrameworkFileUploadController
  },
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_REDACTION_WFD_FILE_UPLOAD,
    ...waterFrameworkFileUploadEntraUserController
  }
]
