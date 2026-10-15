import { siteNoticePrintController } from '#src/server/marine-licence/site-notice/print/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticePrintRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_PRINT}/{marineLicenceId}`,
    ...siteNoticePrintController
  }
]
