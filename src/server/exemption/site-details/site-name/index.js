import { routes } from '#src/server/common/constants/routes.js'
import { siteNameController, siteNameSubmitController } from './controller.js'
export const siteNameRoutes = [
  {
    method: 'GET',
    path: routes.SITE_NAME,
    ...siteNameController
  },
  {
    method: 'POST',
    path: routes.SITE_NAME,
    ...siteNameSubmitController
  }
]
