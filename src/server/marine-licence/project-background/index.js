import {
  projectBackgroundController,
  projectBackgroundSubmitController
} from '#src/server/marine-licence/project-background/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const projectBackgroundRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
    ...projectBackgroundController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
    ...projectBackgroundSubmitController
  }
]
