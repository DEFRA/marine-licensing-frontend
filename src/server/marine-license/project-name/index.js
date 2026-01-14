import { projectNameController } from '#src/server/marine-license/project-name/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const projectNameRoutes = [
  {
    method: 'GET',
    path: routes.MARINE_LICENSE_PROJECT_NAME,
    ...projectNameController
  }
]
