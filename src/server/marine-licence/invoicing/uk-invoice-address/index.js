import {
  ukInvoiceAddressController,
  ukInvoiceAddressSubmitController
} from '#src/server/marine-licence/invoicing/uk-invoice-address/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const ukInvoiceAddressRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
    ...ukInvoiceAddressController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
    ...ukInvoiceAddressSubmitController
  }
]
