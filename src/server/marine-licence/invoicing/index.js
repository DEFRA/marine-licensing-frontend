import { isInvoiceAddressUkOrInternationalRoutes } from '#src/server/marine-licence/invoicing/is-invoice-address-uk-or-international/index.js'
import { ukInvoiceAddressRoutes } from '#src/server/marine-licence/invoicing/uk-invoice-address/index.js'

export const invoicingRoutes = [
  ...isInvoiceAddressUkOrInternationalRoutes,
  ...ukInvoiceAddressRoutes
]
