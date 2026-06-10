import {
  excludedActivitiesController,
  excludedActivitiesSubmitController
} from '#src/server/marine-licence/water-framework-directive/excluded-activities/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const waterFrameworkDirectiveExcludedActivitiesRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
    ...excludedActivitiesController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
    ...excludedActivitiesSubmitController
  }
]
