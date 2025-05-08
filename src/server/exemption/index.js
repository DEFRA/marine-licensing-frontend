import { projectNameRoutes } from '~/src/server/exemption/project-name/index.js'
import { publicRegisterRoutes } from '~/src/server/exemption/public-register/index.js'
import { taskListRoutes } from '~/src/server/exemption/task-list/index.js'

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
        ...publicRegisterRoutes,
        ...taskListRoutes,
        {
          method: 'GET',
          path: '/exemption',
          handler: (_request, h) => {
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
