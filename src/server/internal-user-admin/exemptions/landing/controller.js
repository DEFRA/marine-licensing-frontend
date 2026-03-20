import { validateTeamAdminSession } from '#src/server/common/helpers/user-session-validators.js'

export const DASHBOARD_VIEW_ROUTE =
  'internal-user-admin/exemptions/landing/index.njk'
const DASHBOARD_PAGE_TITLE = 'Exemptions Admin'

export const adminExemptionsController = {
  options: {
    pre: [validateTeamAdminSession]
  },
  handler: async (_request, h) => {
    return h.view(DASHBOARD_VIEW_ROUTE, {
      pageTitle: DASHBOARD_PAGE_TITLE,
      heading: DASHBOARD_PAGE_TITLE
    })
  }
}
