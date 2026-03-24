import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { formatProjectsForDisplay } from '#src/server/internal-user-admin/exemptions/backfill-areas/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { validateTeamAdminSession } from '#src/server/common/helpers/user-session-validators.js'

export const DASHBOARD_VIEW_ROUTE =
  'internal-user-admin/exemptions/backfill-areas/index.njk'
const DASHBOARD_PAGE_TITLE =
  'Exemptions without Marine Plan or Coastal Operations Areas'

export const adminBackfillController = {
  options: {
    pre: [validateTeamAdminSession]
  },
  handler: async (request, h) => {
    try {
      const { payload } = await authenticatedGetRequest(
        request,
        '/exemptions/backfill-areas'
      )
      const projects = payload?.value?.backfillAreas || []
      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: formatProjectsForDisplay(projects, request.plugins.crumb)
      })
    } catch (error) {
      request.logger.error(
        { err: error },
        'Error rendering internal admin page'
      )

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: []
      })
    }
  }
}

export const adminBackfillSendController = {
  options: {
    pre: [validateTeamAdminSession]
  },
  handler: async (request, h) => {
    try {
      await authenticatedPostRequest(request, '/exemption/backfill-areas', {
        id: request.payload.exemptionId
      })
      return h.redirect(routes.ADMIN_BACKFILL)
    } catch (error) {
      request.logger.error(
        { err: error },
        'Error when attempting backfill of Areas'
      )

      return h.redirect(routes.ADMIN_BACKFILL)
    }
  }
}
