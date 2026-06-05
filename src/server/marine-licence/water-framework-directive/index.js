import { waterFrameworkDirectiveBeforeYouStartRoutes } from '#src/server/marine-licence/water-framework-directive/before-you-start/index.js'
import { waterFrameworkDirectiveNauticalMileRoutes } from '#src/server/marine-licence/water-framework-directive/nautical-mile/index.js'
import { waterFrameworkDirectiveExcludedActivitiesRoutes } from '#src/server/marine-licence/water-framework-directive/excluded-activities/index.js'
import { waterFrameworkDirectivePreviousAssessmentRoutes } from '#src/server/marine-licence/water-framework-directive/previous-assessment/index.js'

export const waterDirectiveRoutes = [
  ...waterFrameworkDirectiveBeforeYouStartRoutes,
  ...waterFrameworkDirectiveNauticalMileRoutes,
  ...waterFrameworkDirectiveExcludedActivitiesRoutes,
  ...waterFrameworkDirectivePreviousAssessmentRoutes
]
