import { config } from '#src/config/config.js'
import {
  isEntraIdRoute,
  redirectPathCacheKey,
  routes
} from '#src/server/common/constants/routes.js'
import { validateUserSession } from '#src/server/common/plugins/auth/validate.js'
import { cacheMcmsContextFromQueryParams } from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { EXEMPTION_CACHE_KEY } from '#src/server/common/helpers/session-cache/utils.js'

export const createSessionStrategy = (server) => {
  const cookieConfig = config.get('session.cookie')

  server.auth.strategy('session', 'cookie', {
    cookie: {
      name: 'userSession',
      path: '/',
      password: cookieConfig.password,
      isSecure: cookieConfig.secure,
      ttl: cookieConfig.ttl,
      isSameSite: 'Lax'
    },
    keepAlive: true,
    redirectTo: (request) => {
      cacheMcmsContextFromQueryParams(request)
      request.yar.flash(redirectPathCacheKey, request.path, true)
      return isEntraIdRoute(request.path) ? routes.SIGNIN_ENTRA : routes.SIGNIN
    },
    validate: async (request, session) => {
      const validity = await validateUserSession(request, session)
      if (validity.isValid === false) {
        // clearExemptionCache requires 'h' but validate function doesn't have access to it
        request.yar.clear(EXEMPTION_CACHE_KEY)
      }
      return validity
    }
  })

  server.auth.default('session')
}
