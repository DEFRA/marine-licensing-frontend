import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  siteNoticeResubmitController,
  siteNoticeResubmitSubmitController
} from '#src/server/marine-licence/site-notice/resubmit/controller.js'
import {
  siteNoticeResubmitCloseUpPhotoController,
  siteNoticeResubmitPhotoUploadAndWaitController,
  siteNoticeResubmitPositionPhotoController
} from '#src/server/marine-licence/site-notice/resubmit/photo-controller.js'

const withTask = (route) => `${route}/{marineLicenceId}/{taskId}`

export const siteNoticeResubmitRoutes = [
  {
    method: 'GET',
    path: withTask(marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT),
    ...siteNoticeResubmitController
  },
  {
    method: 'POST',
    path: withTask(marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT),
    ...siteNoticeResubmitSubmitController
  },
  {
    method: 'GET',
    path: withTask(
      marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO
    ),
    ...siteNoticeResubmitCloseUpPhotoController
  },
  {
    method: 'GET',
    path: withTask(
      marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_POSITION_PHOTO
    ),
    ...siteNoticeResubmitPositionPhotoController
  },
  {
    method: 'GET',
    path: withTask(
      marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT
    ),
    ...siteNoticeResubmitPhotoUploadAndWaitController
  }
]
