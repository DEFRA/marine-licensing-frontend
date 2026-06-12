import {
  assessmentChangedController,
  assessmentChangedSubmitController
} from '#src/server/marine-licence/water-framework-directive/assessment-changed/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const waterFrameworkDirectiveAssessmentChangedRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED,
    ...assessmentChangedController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED,
    ...assessmentChangedSubmitController
  }
]
