import { cookiesRoutes } from './cookies/index.js'
import { privacyRoutes } from './privacy/index.js'

/**
 * Sets up the routes used in the help section.
 * These routes are registered in src/server/router.js.
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const help = {
  plugin: {
    name: 'help',
    register(server) {
      server.route([...cookiesRoutes, ...privacyRoutes])
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
