import Boom from '@hapi/boom'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import {
  getSiteNoticeViewDetailsUrl,
  assertIsOriginalSubmitter
} from '#src/server/common/helpers/view-details/utils.js'

export const SITE_NOTICE_DISPLAY_VIEW_ROUTE =
  'marine-licence/site-notice/display/index'

const siteNoticeDisplaySettings = {
  pageTitle: 'Display a site notice',
  heading: 'Display a site notice'
}

export const siteNoticeDisplayController = {
  options: validateMarineLicenceIdParams,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      await assertIsOriginalSubmitter(request, marineLicence)

      const viewDetailsUrl = getSiteNoticeViewDetailsUrl(marineLicenceId)

      return h.view(SITE_NOTICE_DISPLAY_VIEW_ROUTE, {
        ...siteNoticeDisplaySettings,
        backLink: viewDetailsUrl,
        cancelLink: viewDetailsUrl,
        continueLink: viewDetailsUrl,
        pageCaption: `${marineLicence.applicationReference} - ${marineLicence.projectName}`
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }
      request.logger.error(error, 'Error displaying site notice display page')
      throw Boom.internal('Error displaying site notice display page')
    }
  }
}
