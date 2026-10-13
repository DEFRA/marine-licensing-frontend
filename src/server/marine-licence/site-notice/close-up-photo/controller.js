import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import { getViewDetailsUrl } from '#src/server/common/helpers/view-details/utils.js'
import {
  findSiteNoticeTask,
  getLocationIndex,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import {
  getPhotoUploadErrorDisplay,
  initiatePhotoUpload,
  PHOTO_ACCEPT_ATTRIBUTE,
  siteNoticeDisplayUrl,
  siteNoticeEvidenceUrl,
  siteNoticeLocationUrl
} from '#src/server/marine-licence/site-notice/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE =
  'marine-licence/site-notice/close-up-photo/index'

const siteNoticeCloseUpPhotoSettings = {
  pageTitle: 'Close-up photo upload',
  heading: 'Close-up photo upload'
}

export const siteNoticeCloseUpPhotoController = {
  options: {
    ...validateMarineLicenceIdParams,
    pre: [validateEvidenceParam]
  },
  async handler(request, h) {
    const { marineLicenceId } = request.params
    const marineLicence = request.marineLicence

    if (!findSiteNoticeTask(marineLicence)) {
      return h.redirect(getViewDetailsUrl(marineLicenceId))
    }

    const { errorSummary, errors } = getPhotoUploadErrorDisplay(request)

    try {
      const uploadConfig = await initiatePhotoUpload(request, h, {
        field: 'closeUpPhoto',
        uploadPageUrl: siteNoticeEvidenceUrl(
          marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO,
          request
        )
      })

      return h.view(SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE, {
        ...siteNoticeCloseUpPhotoSettings,
        projectName: marineLicence.projectName,
        locationIndex: getLocationIndex(request),
        uploadUrl: uploadConfig.uploadUrl,
        acceptAttribute: PHOTO_ACCEPT_ATTRIBUTE,
        backLink: siteNoticeLocationUrl(request),
        errorSummary,
        errors
      })
    } catch (error) {
      request.logger.error(
        { err: error },
        'Failed to initialise site notice close-up photo upload'
      )
      return h.redirect(siteNoticeDisplayUrl(marineLicenceId))
    }
  }
}
