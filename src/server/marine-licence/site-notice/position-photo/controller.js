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

export const SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE =
  'marine-licence/site-notice/position-photo/index'

const siteNoticePositionPhotoSettings = {
  pageTitle: 'Position and location photo upload',
  heading: 'Position and location photo upload'
}

export const siteNoticePositionPhotoController = {
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
        field: 'positionPhoto',
        uploadPageUrl: siteNoticeEvidenceUrl(
          marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO,
          request
        )
      })

      return h.view(SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE, {
        ...siteNoticePositionPhotoSettings,
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
        'Failed to initialise site notice position photo upload'
      )
      return h.redirect(siteNoticeDisplayUrl(marineLicenceId))
    }
  }
}
