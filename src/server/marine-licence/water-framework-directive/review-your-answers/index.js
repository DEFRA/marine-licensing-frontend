import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  waterFrameworkReviewYourAnswersController,
  reviewYourAnswersSubmitController
} from '#src/server/marine-licence/water-framework-directive/review-your-answers/controller.js'

export const waterFrameworkDirectiveReviewYourAnswersRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS,
    ...waterFrameworkReviewYourAnswersController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS,
    ...reviewYourAnswersSubmitController
  }
]
