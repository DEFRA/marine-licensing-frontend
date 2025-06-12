import { routes } from '~/src/server/common/constants/routes.js'
import { checkYourAnswersController } from '~/src/server/exemption/check-your-answers/controller.js'

export const checkYourAnswersRoutes = [
  {
    method: 'GET',
    path: routes.CHECK_YOUR_ANSWERS,
    ...checkYourAnswersController
  }
]
