import {
  invoiceContactDetailsController,
  invoiceContactDetailsSubmitController
} from '#src/server/marine-licence/invoicing/invoice-contact-details/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const invoiceContactDetailsRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
    ...invoiceContactDetailsController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS,
    ...invoiceContactDetailsSubmitController
  }
]
