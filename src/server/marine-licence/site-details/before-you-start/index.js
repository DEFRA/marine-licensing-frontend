import { beforeYouStartController } from '#src/server/marine-licence/site-details/before-you-start/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const beforeYouStartRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
    ...beforeYouStartController
  }
]
