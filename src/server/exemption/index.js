import { projectNameRoutes } from '~/src/server/exemption/project-name/index.js'

/**
 * Sets up the routes used in the exemption home page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const exemption = {
  plugin: {
    name: 'exemption',
    register(server) {
      server.route([
        ...projectNameRoutes,
        {
          method: 'GET',
          path: '/exemption',
          handler: (request, h) => {
            return h.redirect('/exemption/project-name')
          }
        }
      ])
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
