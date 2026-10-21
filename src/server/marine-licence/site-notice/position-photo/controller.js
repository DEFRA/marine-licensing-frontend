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

export const SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE =
  'marine-licence/site-notice/position-photo/index'

export const siteNoticePositionPhotoSettings = {
  pageTitle: 'Position and location photo upload',
  heading: 'Position and location photo upload'
}

export const siteNoticePositionPhotoController = {
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
      field: 'positionPhoto',
      viewRoute: SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE,
      settings: siteNoticePositionPhotoSettings,
      uploadPageUrl: siteNoticeEvidenceUrl(
        marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO,
        request
      ),
      backLink: siteNoticeLocationUrl(request),
      failureUrl: siteNoticeDisplayUrl(marineLicenceId),
      logLabel: 'site notice position photo upload'
    })
  }
}
