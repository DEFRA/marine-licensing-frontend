import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  checkYourAnswersController,
  checkYourAnswersContinueController
} from '#src/server/marine-licence/check-your-answers/controller.js'

export const checkYourAnswersRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
    ...checkYourAnswersController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
    ...checkYourAnswersContinueController
  }
]
