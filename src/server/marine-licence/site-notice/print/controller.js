import Boom from '@hapi/boom'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import {
  findSiteNoticeTask,
  loadMarineLicence
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import { getViewDetailsUrl } from '#src/server/common/helpers/view-details/utils.js'
import { getSiteNoticeQrCode } from '#src/server/common/helpers/marine-licence/site-notice-qr-code.js'

const SITE_NOTICE_PRINT_VIEW_ROUTE = 'marine-licence/site-notice/print/index'

const SITE_NOTICE_PRINT_PAGE_TITLE = 'Site notice'

const withoutScheme = (url) => {
  const { host, pathname } = new URL(url)
  return `${host}${pathname}`
}

export const siteNoticePrintController = {
  options: validateMarineLicenceIdParams,
  async handler(request, h) {
    try {
      const { marineLicence, marineLicenceId } =
        await loadMarineLicence(request)

      const task = findSiteNoticeTask(marineLicence)

      if (!task) {
        return h.redirect(getViewDetailsUrl(marineLicenceId))
      }

      const summaryOfWorks = task.data?.summary?.siteNoticeSummary?.trim()

      if (!summaryOfWorks) {
        request.logger.warn(
          `Site notice summary missing for marine licence ${marineLicenceId}`
        )
      }

      const qrCode = await getSiteNoticeQrCode(marineLicenceId)

      return h.view(SITE_NOTICE_PRINT_VIEW_ROUTE, {
        pageTitle: SITE_NOTICE_PRINT_PAGE_TITLE,
        applicationReference: marineLicence.applicationReference,
        applicantName: marineLicence.whoMarineLicenceIsFor,
        summaryOfWorks: summaryOfWorks || null,
        qrCode: { ...qrCode, displayUrl: withoutScheme(qrCode.url) }
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }
      request.logger.error(error, 'Error displaying site notice print page')
      throw Boom.internal('Error displaying site notice print page')
    }
  }
}
