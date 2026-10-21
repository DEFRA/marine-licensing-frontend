import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import { getViewDetailsUrl } from '#src/server/common/helpers/view-details/utils.js'
import {
  findSiteNoticeTask,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import {
  renderPhotoUploadPage,
  siteNoticeDisplayUrl,
  siteNoticeEvidenceUrl,
  siteNoticeLocationUrl
} from '#src/server/marine-licence/site-notice/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE =
  'marine-licence/site-notice/close-up-photo/index'

export const siteNoticeCloseUpPhotoSettings = {
  pageTitle: 'Close-up photo upload',
  heading: 'Close-up photo upload'
}

export const siteNoticeCloseUpPhotoController = {
  options: {
    ...validateMarineLicenceIdParams,
    pre: [validateEvidenceParam]
  },
  handler(request, h) {
    const { marineLicenceId } = request.params

    if (!findSiteNoticeTask(request.marineLicence)) {
      return h.redirect(getViewDetailsUrl(marineLicenceId))
    }

    return renderPhotoUploadPage(request, h, {
      field: 'closeUpPhoto',
      viewRoute: SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE,
      settings: siteNoticeCloseUpPhotoSettings,
      uploadPageUrl: siteNoticeEvidenceUrl(
        marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO,
        request
      ),
      backLink: siteNoticeLocationUrl(request),
      failureUrl: siteNoticeDisplayUrl(marineLicenceId),
      logLabel: 'site notice close-up photo upload'
    })
  }
}
