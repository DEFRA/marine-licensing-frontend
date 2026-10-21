import {
  siteNoticeResubmitController,
  siteNoticeResubmitSubmitController
} from '#src/server/marine-licence/site-notice/resubmit/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const siteNoticeResubmitRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT}/{marineLicenceId}/{taskId}`,
    ...siteNoticeResubmitController
  },
  {
    method: 'POST',
    path: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT}/{marineLicenceId}/{taskId}`,
    ...siteNoticeResubmitSubmitController
  }
]
