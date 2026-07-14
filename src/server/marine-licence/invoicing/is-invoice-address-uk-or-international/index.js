import {
  isInvoiceAddressUkOrInternationalController,
  isInvoiceAddressUkOrInternationalSubmitController
} from '#src/server/marine-licence/invoicing/is-invoice-address-uk-or-international/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const isInvoiceAddressUkOrInternationalRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
    ...isInvoiceAddressUkOrInternationalController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
    ...isInvoiceAddressUkOrInternationalSubmitController
  }
]
