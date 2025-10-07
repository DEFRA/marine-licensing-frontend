import { routes } from '#src/server/common/constants/routes.js'
import {
  multipleSitesController,
  multipleSitesSubmitController
} from './controller.js'
export const multipleSitesChoiceRoutes = [
  {
    method: 'GET',
    path: routes.MULTIPLE_SITES_CHOICE,
    ...multipleSitesController
  },
  {
    method: 'POST',
    path: routes.MULTIPLE_SITES_CHOICE,
    ...multipleSitesSubmitController
  }
]
