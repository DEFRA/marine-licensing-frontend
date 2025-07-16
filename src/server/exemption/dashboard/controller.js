import { authenticatedGetRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { formatProjectsForDisplay } from './utils.js'

export const DASHBOARD_VIEW_ROUTE = 'exemption/dashboard/index.njk'
const DASHBOARD_PAGE_TITLE = 'Your projects'

/**
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 */
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
      request.logger.error('Error fetching projects:', error)

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: []
      })
    }
  }
}
