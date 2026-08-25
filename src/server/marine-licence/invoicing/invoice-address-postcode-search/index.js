import {
  invoiceAddressPostcodeSearchController,
  invoiceAddressPostcodeSearchSubmitController
} from '#src/server/marine-licence/invoicing/invoice-address-postcode-search/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const invoiceAddressPostcodeSearchRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
    ...invoiceAddressPostcodeSearchController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
    ...invoiceAddressPostcodeSearchSubmitController
  }
]
