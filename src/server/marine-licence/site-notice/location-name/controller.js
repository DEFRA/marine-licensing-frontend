import Boom from '@hapi/boom'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import {
  getViewDetailsUrl,
  assertIsOriginalSubmitter
} from '#src/server/common/helpers/view-details/utils.js'
import {
  findSiteNoticeTask,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const SITE_NOTICE_LOCATION_NAME_VIEW_ROUTE =
  'marine-licence/site-notice/location-name/index'

const siteNoticeLocationNameSettings = {
  pageTitle: 'Location name',
  heading: 'Location name'
}

const siteNoticeDisplayUrl = (marineLicenceId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`

const siteNoticeLocationNameOptions = {
  ...validateMarineLicenceIdParams,
  pre: [validateEvidenceParam]
}

export const siteNoticeLocationNameController = {
  options: siteNoticeLocationNameOptions,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      await assertIsOriginalSubmitter(request, marineLicence)

      if (!findSiteNoticeTask(marineLicence)) {
        return h.redirect(getViewDetailsUrl(marineLicenceId))
      }

      return h.view(SITE_NOTICE_LOCATION_NAME_VIEW_ROUTE, {
        ...siteNoticeLocationNameSettings,
        backLink: siteNoticeDisplayUrl(marineLicenceId),
        pageCaption: `${marineLicence.applicationReference} - ${marineLicence.projectName}`
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }
      request.logger.error(
        error,
        'Error displaying site notice location name page'
      )
      throw Boom.internal('Error displaying site notice location name page')
    }
  }
}

export const siteNoticeLocationNameSubmitController = {
  options: siteNoticeLocationNameOptions,
  handler(request, h) {
    return h.redirect(siteNoticeDisplayUrl(request.params.marineLicenceId))
  }
}
