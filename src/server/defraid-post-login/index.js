import { confirmEmployeeRoutes } from '#src/server/defraid-post-login/confirm-employee/index.js'
import { confirmIndividualRoutes } from '#src/server/defraid-post-login/confirm-individual/index.js'

export const postLogin = {
  plugin: {
    name: 'postLogin',
    register(server) {
      server.route([...confirmEmployeeRoutes, ...confirmIndividualRoutes])
    }
  }
}
