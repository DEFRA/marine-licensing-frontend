import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { sortProjectsByStatus, formatProjectsForDisplay } from './utils.js'

export const DASHBOARD_VIEW_ROUTE = 'exemption/dashboard/index.njk'
const DASHBOARD_PAGE_TITLE = 'Projects'

const FILTER_MY_PROJECTS = 'my-projects'
const FILTER_ALL_PROJECTS = 'all-projects'

export const dashboardController = {
  handler: async (request, h) => {
    try {
      const { payload } = await authenticatedGetRequest(request, '/exemptions')

      const projects = payload.value ?? []
      const sortedProjects = sortProjectsByStatus(projects)
      const isEmployee = payload.isEmployee ?? false

      const userSession = await getUserSession(
        request,
        request.state?.userSession
      )
      const organisationName = userSession?.organisationName || ''

      const filterValue = request.payload?.filter || FILTER_MY_PROJECTS

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: formatProjectsForDisplay(sortedProjects, isEmployee),
        isEmployee,
        organisationName,
        filterValue,
        filterMyProjects: FILTER_MY_PROJECTS,
        filterAllProjects: FILTER_ALL_PROJECTS
      })
    } catch (error) {
      request.logger.error({ err: error }, 'Error fetching projects')

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: [],
        isEmployee: false,
        filterValue: FILTER_MY_PROJECTS,
        filterMyProjects: FILTER_MY_PROJECTS,
        filterAllProjects: FILTER_ALL_PROJECTS
      })
    }
  }
}
