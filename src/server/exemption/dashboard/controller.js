import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { formatProjectsForDisplay } from './utils.js'

export const DASHBOARD_VIEW_ROUTE = 'exemption/dashboard/index.njk'
const DASHBOARD_PAGE_TITLE = 'Projects'
export const dashboardController = {
  handler: async (request, h) => {
    try {
      const { payload } = await authenticatedGetRequest(request, '/exemptions')

      const projects = payload.value ?? []

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: formatProjectsForDisplay(projects)
      })
    } catch (error) {
      request.logger.error({ err: error }, 'Error fetching projects')

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: []
      })
    }
  }
}
