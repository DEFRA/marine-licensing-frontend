import { projectNameRoutes } from '#src/server/marine-license/project-name/index.js'

export const marineLicense = {
  plugin: {
    name: 'marine-license',
    register(server) {
      server.route([...projectNameRoutes])
    }
  }
}
