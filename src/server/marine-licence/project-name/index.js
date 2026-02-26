import {
  projectNameController,
  projectNameSubmitController
} from '#src/server/marine-licence/project-name/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const projectNameRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
    ...projectNameController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
    ...projectNameSubmitController
  }
]
