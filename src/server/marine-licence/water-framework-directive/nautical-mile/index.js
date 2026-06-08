import {
  nauticalMileController,
  nauticalMileSubmitController
} from '#src/server/marine-licence/water-framework-directive/nautical-mile/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const waterFrameworkDirectiveNauticalMileRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
    ...nauticalMileController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
    ...nauticalMileSubmitController
  }
]
