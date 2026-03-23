import { internalExemptionsUserAdminRoutes } from './exemptions/index.js'

export const internalUserAdmin = {
  plugin: {
    name: 'internalUserAdmin',
    register(server) {
      server.route([...internalExemptionsUserAdminRoutes])
    }
  }
}
