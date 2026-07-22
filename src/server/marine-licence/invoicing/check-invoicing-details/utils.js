import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

export const getBackLink = (request, isIndividual) => {
  if (request.yar.get(RETURN_TO_CACHE_KEY)) {
    return `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#invoicing-card`
  }

  const previousPage = request.headers?.referer

  if (previousPage && URL.canParse(previousPage)) {
    const url = new URL(previousPage)
    const previousPath = url.pathname

    if (previousPath === marineLicenceRoutes.MARINE_LICENCE_TASK_LIST) {
      return marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    }
  }

  if (isIndividual) {
    return marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
  }

  return marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS
}
