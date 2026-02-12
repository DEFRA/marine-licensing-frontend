import {
  confirmIndividualController,
  confirmIndividualSubmitController
} from '#src/server/defraid-post-login/confirm-individual/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const confirmIndividualRoutes = [
  {
    method: 'GET',
    path: routes.postLogin.CONFIRM_INDIVIDUAL,
    ...confirmIndividualController
  },
  {
    method: 'POST',
    path: routes.postLogin.CONFIRM_INDIVIDUAL,
    ...confirmIndividualSubmitController
  }
]
