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
  SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE,
  siteNoticePositionPhotoSettings
} from '#src/server/marine-licence/site-notice/position-photo/controller.js'
import { renderPhotoUploadPage } from '#src/server/marine-licence/site-notice/utils.js'

export const siteNoticeResubmitPositionPhotoController = {
  options: {
    ...validateResubmissionParams,
    pre: [loadResubmissionTask, validateResubmissionLocation]
  },
  handler(request, h) {
    const { marineLicenceId, taskId } = request.params

    return renderPhotoUploadPage(request, h, {
      field: 'positionPhoto',
      viewRoute: SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE,
      settings: siteNoticePositionPhotoSettings,
      uploadPageUrl: resubmissionPhotoUrl(
        marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_POSITION_PHOTO,
        request
      ),
      redirectUrl: resubmissionPhotoUrl(
        marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT,
        request
      ),
      backLink: resubmissionLocationUrl(request),
      failureUrl: resubmissionUrl(marineLicenceId, taskId),
      logLabel: 'site notice resubmission position photo upload'
    })
  }
}
