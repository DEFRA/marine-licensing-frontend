import Boom from '@hapi/boom'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import {
  getViewDetailsUrl,
  assertIsOriginalSubmitter
} from '#src/server/common/helpers/view-details/utils.js'
import {
  findSiteNoticeTask,
  getLocationIndex,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE =
  'marine-licence/site-notice/close-up-photo/index'

const siteNoticeCloseUpPhotoSettings = {
  pageTitle: 'Close-up photo upload',
  heading: 'Close-up photo upload'
}

const siteNoticeDisplayUrl = (marineLicenceId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`

const siteNoticeCloseUpPhotoOptions = {
  ...validateMarineLicenceIdParams,
  pre: [validateEvidenceParam]
}

export const siteNoticeCloseUpPhotoController = {
  options: siteNoticeCloseUpPhotoOptions,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      await assertIsOriginalSubmitter(request, marineLicence)

      if (!findSiteNoticeTask(marineLicence)) {
        return h.redirect(getViewDetailsUrl(marineLicenceId))
      }

      return h.view(SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE, {
        ...siteNoticeCloseUpPhotoSettings,
        backLink: siteNoticeDisplayUrl(marineLicenceId),
        projectName: marineLicence.projectName,
        locationIndex: getLocationIndex(request)
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }
      request.logger.error(
        error,
        'Error displaying site notice close-up photo page'
      )
      throw Boom.internal('Error displaying site notice close-up photo page')
    }
  }
}

export const siteNoticeCloseUpPhotoSubmitController = {
  options: siteNoticeCloseUpPhotoOptions,
  handler(request, h) {
    return h.redirect(siteNoticeDisplayUrl(request.params.marineLicenceId))
  }
}
