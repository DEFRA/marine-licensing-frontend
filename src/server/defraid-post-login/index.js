import { confirmAgentRoutes } from '#src/server/defraid-post-login/confirm-agent/index.js'
import { confirmEmployeeRoutes } from '#src/server/defraid-post-login/confirm-employee/index.js'
import { confirmIndividualRoutes } from '#src/server/defraid-post-login/confirm-individual/index.js'
import { guidanceIndividualRoutes } from '#src/server/defraid-post-login/guidance-individual/index.js'
import { guidanceOrgRoutes } from '#src/server/defraid-post-login/guidance-org/index.js'

export const postLogin = {
  plugin: {
    name: 'postLogin',
    register(server) {
      server.route([
        ...confirmAgentRoutes,
        ...confirmEmployeeRoutes,
        ...confirmIndividualRoutes,
        ...guidanceIndividualRoutes,
        ...guidanceOrgRoutes
      ])
    }
  }
}
