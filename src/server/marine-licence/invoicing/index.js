import { isInvoiceAddressUkOrInternationalRoutes } from '#src/server/marine-licence/invoicing/is-invoice-address-uk-or-international/index.js'
import { invoiceAddressPostcodeSearchRoutes } from '#src/server/marine-licence/invoicing/invoice-address-postcode-search/index.js'
import { chooseYourAddressRoutes } from '#src/server/marine-licence/invoicing/choose-your-address/index.js'
import { confirmAddressRoutes } from '#src/server/marine-licence/invoicing/confirm-address/index.js'
import { ukInvoiceAddressRoutes } from '#src/server/marine-licence/invoicing/uk-invoice-address/index.js'
import { internationalInvoiceAddressRoutes } from '#src/server/marine-licence/invoicing/international-invoice-address/index.js'
import { invoiceContactDetailsRoutes } from '#src/server/marine-licence/invoicing/invoice-contact-details/index.js'
import { purchaseOrderDetailsRoutes } from '#src/server/marine-licence/invoicing/purchase-order-details/index.js'
import { checkInvoicingDetailsRoutes } from '#src/server/marine-licence/invoicing/check-invoicing-details/index.js'

export const invoicingRoutes = [
  ...isInvoiceAddressUkOrInternationalRoutes,
  ...invoiceAddressPostcodeSearchRoutes,
  ...chooseYourAddressRoutes,
  ...confirmAddressRoutes,
  ...ukInvoiceAddressRoutes,
  ...internationalInvoiceAddressRoutes,
  ...invoiceContactDetailsRoutes,
  ...purchaseOrderDetailsRoutes,
  ...checkInvoicingDetailsRoutes
]
