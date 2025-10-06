import { beforeYouStartController } from '#src/server/exemption/site-details/before-you-start/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const beforeYouStartRoutes = [
  {
    method: 'GET',
    path: routes.SITE_DETAILS,
    ...beforeYouStartController
  }
]
