import { projectNameRoutes } from '~/src/server/exemption/project-name/index.js'
import { publicRegisterRoutes } from '~/src/server/exemption/public-register/index.js'
import { taskListRoutes } from '~/src/server/exemption/task-list/index.js'
import { siteDetailsRoutes } from '~/src/server/exemption/site-details/index.js'
import { activityDatesRoutes } from './activity-dates/index.js'
import { activityDescriptionRoutes } from '~/src/server/exemption/activity-description/index.js'
import { checkYourAnswersRoutes } from '~/src/server/exemption/check-your-answers/index.js'
import { routes as confirmationRoutes } from '~/src/server/exemption/confirmation/index.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { dashboardRoutes } from './dashboard/index.js'

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
        ...siteDetailsRoutes,
        ...activityDatesRoutes,
        ...activityDescriptionRoutes,
        ...checkYourAnswersRoutes,
        ...confirmationRoutes,
        ...dashboardRoutes,
        {
          method: 'GET',
          path: '/exemption',
          handler: (_request, h) => {
            return h.redirect(routes.PROJECT_NAME)
          }
        }
      ])
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
