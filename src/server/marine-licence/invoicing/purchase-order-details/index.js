import {
  purchaseOrderDetailsController,
  purchaseOrderDetailsSubmitController
} from '#src/server/marine-licence/invoicing/purchase-order-details/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const purchaseOrderDetailsRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS,
    ...purchaseOrderDetailsController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS,
    ...purchaseOrderDetailsSubmitController
  }
]
