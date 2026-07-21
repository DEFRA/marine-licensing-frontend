import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  checkInvoicingDetailsController,
  checkInvoicingDetailsSubmitController
} from '#src/server/marine-licence/invoicing/check-invoicing-details/controller.js'

export const checkInvoicingDetailsRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
    ...checkInvoicingDetailsController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
    ...checkInvoicingDetailsSubmitController
  }
]
