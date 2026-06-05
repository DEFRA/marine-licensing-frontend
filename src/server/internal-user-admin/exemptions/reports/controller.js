import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { validateTeamAdminSession } from '#src/server/common/helpers/user-session-validators.js'
import { mapExemptionStats, mapSummaryReport } from './utils.js'

export const DASHBOARD_VIEW_ROUTE =
  'internal-user-admin/exemptions/reports/index.njk'
const DASHBOARD_PAGE_TITLE = 'Exemptions summary report'

export const adminReportsController = {
  options: {
    pre: [validateTeamAdminSession]
  },
  handler: async (request, h) => {
    try {
      const { payload } = await authenticatedGetRequest(
        request,
        '/exemptions/summary'
      )
      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        summary: mapSummaryReport(payload?.value),
        stats: mapExemptionStats(payload?.value),
        hasApiError: false
      })
    } catch (error) {
      request.logger.error(
        { err: error },
        'Error rendering internal admin summary report page'
      )

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        summary: mapSummaryReport(),
        stats: mapExemptionStats(),
        hasApiError: true
      })
    }
  }
}
