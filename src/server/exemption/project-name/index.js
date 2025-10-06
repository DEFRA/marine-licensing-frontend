import {
  projectNameController,
  projectNameSubmitController
} from '#src/server/exemption/project-name/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const projectNameRoutes = [
  {
    method: 'GET',
    path: routes.PROJECT_NAME,
    ...projectNameController
  },
  {
    method: 'POST',
    path: routes.PROJECT_NAME,
    ...projectNameSubmitController
  }
]
