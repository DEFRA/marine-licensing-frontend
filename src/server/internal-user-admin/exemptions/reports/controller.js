import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { validateTeamAdminSession } from '#src/server/common/helpers/user-session-validators.js'

export const DASHBOARD_VIEW_ROUTE =
  'internal-user-admin/exemptions/reports/index.njk'
const DASHBOARD_PAGE_TITLE = 'Exemptions summary report'

const mapSummaryReport = (value) => ({
  submittedExemptions: value?.submittedExemptions ?? 0,
  unsubmittedExemptions: value?.unsubmittedExemptions ?? 0,
  withdrawnExemptions: value?.withdrawnExemptions ?? 0
})

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
        hasApiError: true
      })
    }
  }
}
