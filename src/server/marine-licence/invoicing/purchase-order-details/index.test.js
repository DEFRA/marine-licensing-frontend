import { purchaseOrderDetailsRoutes } from '#src/server/marine-licence/invoicing/purchase-order-details/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('purchaseOrderDetailsRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(purchaseOrderDetailsRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(purchaseOrderDetailsRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS
      })
    )
  })
})
