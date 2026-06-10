import {
  previousAssessmentController,
  previousAssessmentSubmitController
} from '#src/server/marine-licence/water-framework-directive/previous-assessment/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const waterFrameworkDirectivePreviousAssessmentRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT,
    ...previousAssessmentController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT,
    ...previousAssessmentSubmitController
  }
]
