import { projectNameController } from '#src/server/marine-license/project-name/controller.js'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'

export const projectNameRoutes = [
  {
    method: 'GET',
    path: marineLicenseRoutes.PROJECT_NAME,
    ...projectNameController
  }
]
