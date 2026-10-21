import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getLocationIndex } from '#src/server/common/helpers/marine-licence/site-notice.js'
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
import {
  getPhotoUploadErrorDisplay,
  initiatePhotoUpload,
  PHOTO_ACCEPT_ATTRIBUTE
} from '#src/server/marine-licence/site-notice/utils.js'

export const siteNoticeResubmitCloseUpPhotoController = {
  options: {
    ...validateResubmissionParams,
    pre: [loadResubmissionTask, validateResubmissionLocation]
  },
  async handler(request, h) {
    const { marineLicenceId, taskId } = request.params
    const marineLicence = request.marineLicence

    const { errorSummary, errors } = getPhotoUploadErrorDisplay(request)

    try {
      const uploadConfig = await initiatePhotoUpload(request, h, {
        field: 'closeUpPhoto',
        uploadPageUrl: resubmissionPhotoUrl(
          marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO,
          request
        ),
        redirectUrl: resubmissionPhotoUrl(
          marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT,
          request
        )
      })

      return h.view(SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE, {
        ...siteNoticeCloseUpPhotoSettings,
        projectName: marineLicence.projectName,
        locationIndex: getLocationIndex(request),
        uploadUrl: uploadConfig.uploadUrl,
        acceptAttribute: PHOTO_ACCEPT_ATTRIBUTE,
        backLink: resubmissionLocationUrl(request),
        errorSummary,
        errors
      })
    } catch (error) {
      request.logger.error(
        { err: error },
        'Failed to initialise site notice resubmission close-up photo upload'
      )
      return h.redirect(resubmissionUrl(marineLicenceId, taskId))
    }
  }
}
