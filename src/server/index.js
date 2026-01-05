import path from 'node:path'
import hapi from '@hapi/hapi'

import bell from '@hapi/bell'
import cookie from '@hapi/cookie'
import basic from '@hapi/basic'
import { config } from '#src/config/config.js'
import { nunjucksConfig } from '#src/config/nunjucks/nunjucks.js'
import { router } from './router.js'
import { requestLogger } from '#src/server/common/helpers/logging/request-logger.js'
import { catchAll } from '#src/server/common/helpers/errors.js'
import { secureContext } from '@defra/hapi-secure-context'
import { sessionCache } from '#src/server/common/helpers/session-cache/session-cache.js'
import { getCacheEngine } from '#src/server/common/helpers/session-cache/cache-engine.js'
import { pulse } from '#src/server/common/helpers/pulse.js'
import { requestTracing } from '#src/server/common/helpers/request-tracing.js'
import { setupProxy } from '#src/server/common/helpers/proxy/setup-proxy.js'
import { csrf } from '#src/server/common/helpers/csrf.js'
import { openId } from '#src/server/common/plugins/open-id.js'
import { cookies } from '#src/server/common/plugins/cookies.js'
import { setPageCacheControlHeaders } from '#src/server/common/helpers/cache-control.js'
import { contentSecurityPolicy } from '#src/server/common/helpers/content-security-policy.js'
import { journeyLogger } from '#src/server/common/helpers/logging/journey-logger.js'

export async function createServer() {
  setupProxy()
  const server = hapi.server({
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(config.get('session.cache.engine'))
      }
    ],
    state: {
      strictHeader: false
    }
  })

  server.app.cache = server.cache({
    cache: 'session',
    expiresIn: config.get('redis.ttl'),
    segment: 'session'
  })

  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache,
    journeyLogger,
    bell,
    cookie,
    basic,
    nunjucksConfig,
    contentSecurityPolicy,
    csrf,
    openId,
    cookies,
    router // Register all the controllers/routes defined in src/server/router.js
  ])

  server.ext('onPreResponse', setPageCacheControlHeaders)
  server.ext('onPreResponse', catchAll)

  return server
}

/**
 * @import {Engine} from '~/src/server/common/helpers/session-cache/cache-engine.js'
 */
