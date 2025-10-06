import {
  widthOfSiteController,
  widthOfSiteSubmitController
} from '#src/server/exemption/site-details/width-of-site/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const widthOfSiteRoutes = [
  {
    method: 'GET',
    path: routes.WIDTH_OF_SITE,
    ...widthOfSiteController
  },
  {
    method: 'POST',
    path: routes.WIDTH_OF_SITE,
    ...widthOfSiteSubmitController
  }
]
