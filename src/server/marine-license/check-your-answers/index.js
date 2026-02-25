import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'
import { checkYourAnswersController } from '#src/server/marine-license/check-your-answers/controller.js'

export const checkYourAnswersRoutes = [
  {
    method: 'GET',
    path: marineLicenseRoutes.MARINE_LICENSE_CHECK_YOUR_ANSWERS,
    ...checkYourAnswersController
  }
]
