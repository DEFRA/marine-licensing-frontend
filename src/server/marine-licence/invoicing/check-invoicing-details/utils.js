import {
  marineLicenceInvoicingRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'
import {
  ADDRESS_SOURCE,
  INVOICE_TYPE_OPTIONS
} from '#src/server/common/validation/invoicing/constants.js'

// A looked-up address is changed by searching again rather than by typing over it.
// An address saved before the source was recorded has none, so it keeps the manual
// entry page it has always used. With no address type chosen there is nothing to
// change yet, so the question that decides the type comes first.
export const getAddressChangeRoute = (invoicing) => {
  if (!invoicing?.invoiceAddressType) {
    return marineLicenceInvoicingRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
  }

  if (invoicing.invoiceAddressType !== INVOICE_TYPE_OPTIONS.UK) {
    return marineLicenceInvoicingRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
  }

  if (invoicing.invoiceAddressSource === ADDRESS_SOURCE.LOOKUP) {
    return marineLicenceInvoicingRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
  }

  return marineLicenceInvoicingRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
}

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
