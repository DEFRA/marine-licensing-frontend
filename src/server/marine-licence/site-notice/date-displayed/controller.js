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

export const SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE =
  'marine-licence/site-notice/date-displayed/index'

const siteNoticeDateDisplayedSettings = {
  pageTitle: 'When did you first display the notice?',
  heading: 'When did you first display the notice?'
}

const siteNoticeDisplayUrl = (marineLicenceId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`

const siteNoticeDateDisplayedOptions = {
  ...validateMarineLicenceIdParams,
  pre: [validateEvidenceParam]
}

export const siteNoticeDateDisplayedController = {
  options: siteNoticeDateDisplayedOptions,
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      await assertIsOriginalSubmitter(request, marineLicence)

      if (!findSiteNoticeTask(marineLicence)) {
        return h.redirect(getViewDetailsUrl(marineLicenceId))
      }

      return h.view(SITE_NOTICE_DATE_DISPLAYED_VIEW_ROUTE, {
        ...siteNoticeDateDisplayedSettings,
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
        'Error displaying site notice date displayed page'
      )
      throw Boom.internal('Error displaying site notice date displayed page')
    }
  }
}

export const siteNoticeDateDisplayedSubmitController = {
  options: siteNoticeDateDisplayedOptions,
  handler(request, h) {
    return h.redirect(siteNoticeDisplayUrl(request.params.marineLicenceId))
  }
}
