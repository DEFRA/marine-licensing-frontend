import {
  confirmAgentController,
  confirmAgentSubmitController
} from '#src/server/defraid-post-login/confirm-agent/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const confirmAgentRoutes = [
  {
    method: 'GET',
    path: routes.postLogin.CONFIRM_AGENT,
    ...confirmAgentController
  },
  {
    method: 'POST',
    path: routes.postLogin.CONFIRM_AGENT,
    ...confirmAgentSubmitController
  }
]
