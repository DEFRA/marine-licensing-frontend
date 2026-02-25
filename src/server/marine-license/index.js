import { checkYourAnswersRoutes } from '#src/server/marine-license/check-your-answers/index.js'
import { projectNameRoutes } from '#src/server/marine-license/project-name/index.js'
import { taskListRoutes } from '#src/server/marine-license/task-list/index.js'

export const marineLicense = {
  plugin: {
    name: 'marine-license',
    register(server) {
      server.route([
        ...checkYourAnswersRoutes,
        ...projectNameRoutes,
        ...taskListRoutes
      ])
    }
  }
}
