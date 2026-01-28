import {
  projectNameController,
  projectNameSubmitController
} from '#src/server/marine-license/project-name/controller.js'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'

export const projectNameRoutes = [
  {
    method: 'GET',
    path: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
    ...projectNameController
  },
  {
    method: 'POST',
    path: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
    ...projectNameSubmitController
  }
]
