import { waterFrameworkDirectiveBeforeYouStartRoutes } from '#src/server/marine-licence/water-framework-directive/before-you-start/index.js'
import { waterFrameworkDirectiveNauticalMileRoutes } from '#src/server/marine-licence/water-framework-directive/nautical-mile/index.js'
import { waterFrameworkDirectiveExcludedActivitiesRoutes } from '#src/server/marine-licence/water-framework-directive/excluded-activities/index.js'
import { waterFrameworkFileUploadRoutes } from '#src/server/marine-licence/water-framework-directive/file-upload/index.js'
import { waterFrameworkDirectiveUploadAndWaitRoutes } from '#src/server/marine-licence/water-framework-directive/upload-and-wait/index.js'
import { waterFrameworkDirectiveReviewYourAnswersRoutes } from '#src/server/marine-licence/water-framework-directive/review-your-answers/index.js'

export const waterDirectiveRoutes = [
  ...waterFrameworkDirectiveBeforeYouStartRoutes,
  ...waterFrameworkDirectiveNauticalMileRoutes,
  ...waterFrameworkDirectiveExcludedActivitiesRoutes,
  ...waterFrameworkFileUploadRoutes,
  ...waterFrameworkDirectiveUploadAndWaitRoutes,
  ...waterFrameworkDirectiveReviewYourAnswersRoutes
]
