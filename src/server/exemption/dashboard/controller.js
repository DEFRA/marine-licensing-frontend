import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { sortProjectsByStatus, formatProjectsForDisplay } from './utils.js'

export const DASHBOARD_VIEW_ROUTE = 'exemption/dashboard/index.njk'
const DASHBOARD_PAGE_TITLE = 'Projects'
export const dashboardController = {
  handler: async (request, h) => {
    try {
      const { payload } = await authenticatedGetRequest(request, '/exemptions')

      const projects = payload.value ?? []
      const sortedProjects = sortProjectsByStatus(projects)

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: formatProjectsForDisplay(sortedProjects)
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
