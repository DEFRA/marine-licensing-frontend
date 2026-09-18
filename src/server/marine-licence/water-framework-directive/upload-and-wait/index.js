import { waterFrameworkDirectiveUploadAndWaitController } from '#src/server/marine-licence/water-framework-directive/upload-and-wait/controller.js'
import { waterFrameworkDirectiveUploadAndWaitEntraUserController } from '#src/server/marine-licence/water-framework-directive/upload-and-wait/entra-user-controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const waterFrameworkDirectiveUploadAndWaitRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_UPLOAD_AND_WAIT,
    ...waterFrameworkDirectiveUploadAndWaitController
  },
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_REDACTION_WFD_UPLOAD_AND_WAIT,
    ...waterFrameworkDirectiveUploadAndWaitEntraUserController
  }
]
