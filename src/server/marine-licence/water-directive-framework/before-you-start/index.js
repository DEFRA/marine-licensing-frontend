import { waterFrameworkDirectiveBeforeYouStartController } from '#src/server/marine-licence/water-directive-framework/before-you-start/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const waterFrameworkDirectiveBeforeYouStartRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
    ...waterFrameworkDirectiveBeforeYouStartController
  }
]
