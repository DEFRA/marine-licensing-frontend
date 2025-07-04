export const DASHBOARD_VIEW_ROUTE = 'exemption/dashboard/index.njk'

/**
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 */
export const dashboardController = {
  handler: (request, h) => {
    // Example projects data, replace with real data source
    const projects = []
    return h.view(DASHBOARD_VIEW_ROUTE, {
      pageTitle: 'Projects Home',
      heading: 'Projects Home',
      projects
    })
  }
}
