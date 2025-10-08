import {
  redirectPathCacheKey,
  routes
} from '#src/server/common/constants/routes.js'
import { setUserSession } from './utils.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'

export const signInOidcController = {
  method: ['GET', 'POST'],
  path: routes.AUTH_DEFRA_ID_CALLBACK,
  options: {
    auth: { strategy: AUTH_STRATEGIES.DEFRA_ID, mode: 'try' }
  },
  handler: async (request, h) => {
    if (request.auth?.isAuthenticated) {
      await setUserSession(request)
      request.logger.info('User has been successfully authenticated')
    }

    const redirect =
      request.yar.flash(redirectPathCacheKey) ?? routes.PROJECT_NAME

    return h.redirect(redirect)
  }
}
