import { routes } from '~/src/server/common/constants/routes.js'
import {
  checkYourAnswersController,
  checkYourAnswersSubmitController
} from '~/src/server/exemption/check-your-answers/controller.js'

export const checkYourAnswersRoutes = [
  {
    method: 'GET',
    path: routes.CHECK_YOUR_ANSWERS,
    ...checkYourAnswersController
  },
  {
    method: 'POST',
    path: routes.CHECK_YOUR_ANSWERS,
    ...checkYourAnswersSubmitController
  }
]
