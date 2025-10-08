import { cookiesRoutes } from './cookies/index.js'
import { privacyRoutes } from './privacy/index.js'
export const help = {
  plugin: {
    name: 'help',
    register(server) {
      server.route([...cookiesRoutes, ...privacyRoutes])
    }
  }
}
