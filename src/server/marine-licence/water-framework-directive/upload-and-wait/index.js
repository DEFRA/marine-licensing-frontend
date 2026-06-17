import { waterFrameworkDirectiveUploadAndWaitController } from '#src/server/marine-licence/water-framework-directive/upload-and-wait/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const waterFrameworkDirectiveUploadAndWaitRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_UPLOAD_AND_WAIT,
    ...waterFrameworkDirectiveUploadAndWaitController
  }
]
