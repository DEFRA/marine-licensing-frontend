import { config } from '#src/config/config.js'
import {
  isEntraIdRoute,
  redirectPathCacheKey,
  routes
} from '#src/server/common/constants/routes.js'
import { validateUserSession } from '#src/server/common/plugins/auth/validate.js'
import { cacheMcmsContextFromQueryParams } from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { EXEMPTION_CACHE_KEY } from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { isUserReferredFromDefraAccount } from '#src/server/common/helpers/check-request-referrer.js'

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
      if (request.path === '/' && !isUserReferredFromDefraAccount(request)) {
        if (request.query.ACTIVITY_TYPE) {
          // in case the user is not logged in and comes from the IAT tool / MCMS
          cacheMcmsContextFromQueryParams(request)
          request.yar.flash(redirectPathCacheKey, request.path, true)
        } else {
          request.yar.flash(redirectPathCacheKey, routes.DASHBOARD, true)
        }
      } else {
        request.yar.flash(redirectPathCacheKey, request.path, true)
      }
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
