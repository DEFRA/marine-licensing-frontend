import {
  redirectPathCacheKey,
  routes
} from '#src/server/common/constants/routes.js'
import { setUserSession } from './utils.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'

export const signInOidcEntraController = {
  method: ['GET', 'POST'],
  path: routes.AUTH_ENTRA_ID_CALLBACK,
  options: {
    auth: AUTH_STRATEGIES.ENTRA_ID
  },
  handler: async (request, h) => {
    await setUserSession(request)
    const redirect = request.yar.flash(redirectPathCacheKey)
    return h.redirect(redirect)
  }
}
