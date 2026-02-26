import { checkYourAnswersRoutes } from '#src/server/marine-licence/check-your-answers/index.js'
import { projectNameRoutes } from '#src/server/marine-licence/project-name/index.js'
import { taskListRoutes } from '#src/server/marine-licence/task-list/index.js'
import { deleteMarineLicenceRoutes } from '#src/server/marine-licence/delete/index.js'

export const marineLicence = {
  plugin: {
    name: 'marine-licence',
    register(server) {
      server.route([
        ...checkYourAnswersRoutes,
        ...projectNameRoutes,
        ...taskListRoutes,
        ...deleteMarineLicenceRoutes
      ])
    }
  }
}
