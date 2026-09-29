import Boom from '@hapi/boom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'

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

      const viewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`

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
