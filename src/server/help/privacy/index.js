import { privacyController } from '~/src/server/help/privacy/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the /privacy page.
 * These routes are registered in src/server/router.js.
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const privacy = {
  plugin: {
    name: 'privacy',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.PRIVACY,
          options: {
            auth: { strategy: 'defra-id', mode: 'try' }
          },
          ...privacyController
        }
      ])
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
