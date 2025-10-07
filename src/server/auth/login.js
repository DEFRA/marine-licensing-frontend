import { routes } from '#src/server/common/constants/routes.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'

export const loginController = {
  method: 'GET',
  path: routes.SIGNIN,
  options: {
    auth: {
      strategy: AUTH_STRATEGIES.DEFRA_ID,
      mode: 'try'
    }
  },
  handler: (_request, h) => {
    return h.redirect(routes.PROJECT_NAME)
  }
}
