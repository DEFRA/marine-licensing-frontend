import {
  internationalInvoiceAddressController,
  internationalInvoiceAddressSubmitController
} from '#src/server/marine-licence/invoicing/international-invoice-address/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const internationalInvoiceAddressRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS,
    ...internationalInvoiceAddressController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS,
    ...internationalInvoiceAddressSubmitController
  }
]
