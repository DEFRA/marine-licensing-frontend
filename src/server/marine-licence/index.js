import { checkYourAnswersRoutes } from '#src/server/marine-licence/check-your-answers/index.js'
import { confirmationRoutes } from '#src/server/marine-licence/confirmation/index.js'
import { projectNameRoutes } from '#src/server/marine-licence/project-name/index.js'
import { taskListRoutes } from '#src/server/marine-licence/task-list/index.js'
import { deleteMarineLicenceRoutes } from '#src/server/marine-licence/delete/index.js'
import { specialLegalPowersRoutes } from '#src/server/marine-licence/special-legal-powers/index.js'
import { publicRegisterRoutes } from '#src/server/marine-licence/public-register/index.js'
import { otherAuthoritiesRoutes } from '#src/server/marine-licence/other-authorities/index.js'
import { projectBackgroundRoutes } from '#src/server/marine-licence/project-background/index.js'
import { siteDetailsRoutes } from '#src/server/marine-licence/site-details/index.js'
import { viewDetailsRoutes } from '#src/server/marine-licence/view-details/index.js'
import { viewMarineLicencePublicUserRoutes } from '#src/server/marine-licence/view-marine-licence-public/index.js'
import { viewMarineLicenceInternalUserRoutes } from '#src/server/marine-licence/view-marine-licence-internal-user/index.js'

export const marineLicence = {
  plugin: {
    name: 'marine-licence',
    register(server) {
      server.route([
        ...checkYourAnswersRoutes,
        ...confirmationRoutes,
        ...projectNameRoutes,
        ...taskListRoutes,
        ...deleteMarineLicenceRoutes,
        ...specialLegalPowersRoutes,
        ...publicRegisterRoutes,
        ...otherAuthoritiesRoutes,
        ...projectBackgroundRoutes,
        ...siteDetailsRoutes,
        ...viewDetailsRoutes,
        ...viewMarineLicencePublicUserRoutes,
        ...viewMarineLicenceInternalUserRoutes
      ])
    }
  }
}
