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

export const SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE =
  'marine-licence/site-notice/position-photo/index'

const siteNoticePositionPhotoSettings = {
  pageTitle: 'Position and location photo upload',
  heading: 'Position and location photo upload'
}

const siteNoticeDisplayUrl = (marineLicenceId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`

const siteNoticePositionPhotoOptions = {
  ...validateMarineLicenceIdParams,
  pre: [validateEvidenceParam]
}

export const siteNoticePositionPhotoController = {
  options: siteNoticePositionPhotoOptions,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      await assertIsOriginalSubmitter(request, marineLicence)

      if (!findSiteNoticeTask(marineLicence)) {
        return h.redirect(getViewDetailsUrl(marineLicenceId))
      }

      return h.view(SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE, {
        ...siteNoticePositionPhotoSettings,
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
        'Error displaying site notice position photo page'
      )
      throw Boom.internal('Error displaying site notice position photo page')
    }
  }
}

export const siteNoticePositionPhotoSubmitController = {
  options: siteNoticePositionPhotoOptions,
  handler(request, h) {
    return h.redirect(siteNoticeDisplayUrl(request.params.marineLicenceId))
  }
}
