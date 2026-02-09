import { projectNameRoutes } from '#src/server/exemption/project-name/index.js'
import { publicRegisterRoutes } from '#src/server/exemption/public-register/index.js'
import { taskListRoutes } from '#src/server/exemption/task-list/index.js'
import { siteDetailsRoutes } from '#src/server/exemption/site-details/index.js'
import { activityDatesRoutes } from './activity-dates/index.js'
import { activityDescriptionRoutes } from '#src/server/exemption/activity-description/index.js'
import { checkYourAnswersRoutes } from '#src/server/exemption/check-your-answers/index.js'
import { viewDetailsRoutes } from '#src/server/exemption/view-details/index.js'
import { routes as confirmationRoutes } from '#src/server/exemption/confirmation/index.js'
import { routes } from '#src/server/common/constants/routes.js'
import { dashboardRoutes } from './dashboard/index.js'
import { deleteExemptionRoutes } from './delete/index.js'
import { withdrawExemptionRoutes } from './withdraw/index.js'
import { viewExemptionInternalUserRoutes } from '#src/server/exemption/view-exemption-internal-user/index.js'
import { getPageViewCommonData } from '#src/server/common/helpers/page-view-common-data.js'
import { viewExemptionPublicUserRoutes } from '#src/server/exemption/view-exemption-public/index.js'
export const exemption = {
  plugin: {
    name: 'exemption',
    register(server) {
      server.ext('onPreHandler', async (request, h) => {
        request.app.commonPageViewData = await getPageViewCommonData(request)
        return h.continue
      })

      server.ext('onPreResponse', (request, h) => {
        const response = request.response
        if (response.variety === 'view') {
          response.source.context = {
            ...response.source.context,
            ...request.app
          }
        }
        return h.continue
      })

      server.route([
        ...projectNameRoutes,
        ...publicRegisterRoutes,
        ...taskListRoutes,
        ...siteDetailsRoutes,
        ...activityDatesRoutes,
        ...activityDescriptionRoutes,
        ...checkYourAnswersRoutes,
        ...viewDetailsRoutes,
        ...viewExemptionInternalUserRoutes,
        ...viewExemptionPublicUserRoutes,
        ...confirmationRoutes,
        ...dashboardRoutes,
        ...deleteExemptionRoutes,
        ...withdrawExemptionRoutes,
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
