import { ukInvoiceAddressRoutes } from '#src/server/marine-licence/invoicing/uk-invoice-address/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('ukInvoiceAddressRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(ukInvoiceAddressRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(ukInvoiceAddressRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
      })
    )
  })
})
