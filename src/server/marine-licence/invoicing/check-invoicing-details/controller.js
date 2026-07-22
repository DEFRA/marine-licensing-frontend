import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { invoicingReviewData } from '#src/server/common/helpers/marine-licence/invoicing/invoicing-review-data.js'
import { getBackLink } from '#src/server/marine-licence/invoicing/check-invoicing-details/utils.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'
import { isIndividualUser } from '#src/server/common/helpers/user-session-utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'

export const CHECK_INVOICING_DETAILS_VIEW_ROUTE =
  'marine-licence/invoicing/check-invoicing-details/index'

const CHECK_INVOICING_DETAILS_PAGE_TITLE = 'Check your invoicing details'

const checkInvoicingDetailsPageData = {
  pageTitle: CHECK_INVOICING_DETAILS_PAGE_TITLE,
  heading: CHECK_INVOICING_DETAILS_PAGE_TITLE
}

export const checkInvoicingDetailsController = {
  async handler(request, h) {
    const cachedMarineLicence = getMarineLicenceCache(request)

    const marineLicenceService = getMarineLicenceService(request)
    const marineLicence = await marineLicenceService.getMarineLicenceById(
      cachedMarineLicence.id
    )

    const { invoicing = {} } = marineLicence

    await setMarineLicenceCache(request, h, {
      ...cachedMarineLicence,
      invoicing
    })

    const isIndividual = await isIndividualUser(request)
    const invoicingDisplayData = invoicingReviewData(invoicing)

    return h.view(CHECK_INVOICING_DETAILS_VIEW_ROUTE, {
      ...checkInvoicingDetailsPageData,
      projectName: marineLicence.projectName,
      backLink: getBackLink(request, isIndividual),
      invoicing,
      invoicingDisplayData,
      isIndividual
    })
  }
}

export const checkInvoicingDetailsSubmitController = {
  async handler(request, h) {
    const redirectPath = request.yar.get(RETURN_TO_CACHE_KEY)
    if (redirectPath) {
      return h.redirect(`${redirectPath}#invoicing-card`)
    }
    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  }
}
