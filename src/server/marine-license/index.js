import { projectNameRoutes } from '#src/server/marine-license/project-name/index.js'
import { taskListRoutes } from '#src/server/marine-license/task-list/index.js'
import { deleteMarineLicenseRoutes } from '#src/server/marine-license/delete/index.js'

export const marineLicense = {
  plugin: {
    name: 'marine-license',
    register(server) {
      server.route([
        ...projectNameRoutes,
        ...taskListRoutes,
        ...deleteMarineLicenseRoutes
      ])
    }
  }
}
