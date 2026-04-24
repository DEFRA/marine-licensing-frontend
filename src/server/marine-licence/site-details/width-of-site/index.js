import {
  widthOfSiteController,
  widthOfSiteSubmitController
} from '#src/server/marine-licence/site-details/width-of-site/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const widthOfSiteRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
    ...widthOfSiteController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
    ...widthOfSiteSubmitController
  }
]
