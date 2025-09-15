import { getOidcConfig } from '~/src/server/common/plugins/auth/get-oidc-config.js'
import { config } from '~/src/config/config.js'
import { openIdProvider } from '~/src/server/common/plugins/auth/open-id.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { validateUserSession } from '~/src/server/common/plugins/auth/validate.js'
import { cacheMcmsContextFromQueryParams } from '~/src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { clearExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'

export const defraId = {
  plugin: {
    name: 'auth',
    register: async (server) => {
      const { authEnabled } = config.get('defraId')
      const { cookie } = config.get('session')

      if (!authEnabled) {
        server.auth.strategy('defra-id', 'basic', {
          validate: () => ({ isValid: true })
        })

        server.auth.strategy('session', 'cookie', {
          cookie: {
            name: 'userSession',
            path: '/',
            password: cookie.password,
            isSecure: cookie.secure,
            ttl: cookie.ttl,
            isSameSite: 'Lax'
          },
          keepAlive: true,
          redirectTo: '/login',
          validate: () => ({ isValid: true })
        })

        return
      }

      const oidcConfig = await getOidcConfig()
      const defra = openIdProvider('defraId', oidcConfig)
      const { clientId, clientSecret, serviceId, redirectUrl } =
        config.get('defraId')

      server.auth.strategy('defra-id', 'bell', {
        location: (request) => {
          request.yar.flash('referrer', routes.PROJECT_NAME)
          return `${redirectUrl}${routes.AUTH_DEFRA_ID_CALLBACK}`
        },
        provider: defra,
        password: cookie.password,
        clientId,
        clientSecret,
        isSecure: cookie.secure,
        providerParams: {
          serviceId
        }
      })

      server.auth.strategy('session', 'cookie', {
        cookie: {
          name: 'userSession',
          path: '/',
          password: cookie.password,
          isSecure: cookie.secure,
          ttl: cookie.ttl,
          isSameSite: 'Lax'
        },
        keepAlive: true,
        redirectTo: (request) => {
          cacheMcmsContextFromQueryParams(request)
          return `/login`
        },
        validate: async (request, session) => {
          const validity = await validateUserSession(request, session)
          if (validity.isValid === false) {
            clearExemptionCache(request)
          }
          return validity
        }
      })

      server.auth.default('session')
    }
  }
}
