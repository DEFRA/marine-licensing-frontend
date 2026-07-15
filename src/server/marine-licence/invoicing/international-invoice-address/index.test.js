import { internationalInvoiceAddressRoutes } from '#src/server/marine-licence/invoicing/international-invoice-address/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('internationalInvoiceAddressRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(internationalInvoiceAddressRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(internationalInvoiceAddressRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
      })
    )
  })
})
