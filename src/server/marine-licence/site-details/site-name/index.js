import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { siteNameController, siteNameSubmitController } from './controller.js'

export const siteNameRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
    ...siteNameController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
    ...siteNameSubmitController
  }
]
