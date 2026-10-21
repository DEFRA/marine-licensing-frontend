import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  loadResubmissionTask,
  resubmissionLocationUrl,
  resubmissionPhotoUrl,
  resubmissionUrl,
  validateResubmissionLocation,
  validateResubmissionParams
} from '#src/server/common/helpers/marine-licence/site-notice-resubmission.js'
import {
  SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE,
  siteNoticeCloseUpPhotoSettings
} from '#src/server/marine-licence/site-notice/close-up-photo/controller.js'
import { renderPhotoUploadPage } from '#src/server/marine-licence/site-notice/utils.js'

export const siteNoticeResubmitCloseUpPhotoController = {
  options: {
    ...validateResubmissionParams,
    pre: [loadResubmissionTask, validateResubmissionLocation]
  },
  handler(request, h) {
    const { marineLicenceId, taskId } = request.params

    return renderPhotoUploadPage(request, h, {
      field: 'closeUpPhoto',
      viewRoute: SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE,
      settings: siteNoticeCloseUpPhotoSettings,
      uploadPageUrl: resubmissionPhotoUrl(
        marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO,
        request
      ),
      redirectUrl: resubmissionPhotoUrl(
        marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT,
        request
      ),
      backLink: resubmissionLocationUrl(request),
      failureUrl: resubmissionUrl(marineLicenceId, taskId),
      logLabel: 'site notice resubmission close-up photo upload'
    })
  }
}
