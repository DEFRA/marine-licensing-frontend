import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { formatProjectsForDisplay } from '#src/server/internal-user-admin/exemptions/emp/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { validateTeamAdminSession } from '#src/server/common/helpers/user-session-validators.js'

export const DASHBOARD_VIEW_ROUTE =
  'internal-user-admin/exemptions/emp/index.njk'
const DASHBOARD_PAGE_TITLE = 'Exemptions not sent to EMP'

export const adminEmpController = {
  options: {
    pre: [validateTeamAdminSession]
  },
  handler: async (request, h) => {
    try {
      const { payload } = await authenticatedGetRequest(
        request,
        '/exemptions/send-to-emp'
      )
      const projects = payload?.value?.unsentExemptions || []
      const failedPendingRetries = payload?.value?.failedPendingRetries || []
      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: formatProjectsForDisplay(projects, request.plugins.crumb),
        failedPendingRetries
      })
    } catch (error) {
      request.logger.error(
        { err: error },
        'Error rendering internal admin page'
      )

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: [],
        failedPendingRetries: []
      })
    }
  }
}

export const adminEmpSendController = {
  options: {
    pre: [validateTeamAdminSession]
  },
  handler: async (request, h) => {
    try {
      await authenticatedPostRequest(request, '/exemption/send-to-emp', {
        id: request.payload.exemptionId
      })
      return h.redirect(routes.ADMIN_EMP)
    } catch (error) {
      request.logger.error({ err: error }, 'Error sending exemption to EMP')

      return h.redirect(routes.ADMIN_EMP)
    }
  }
}
