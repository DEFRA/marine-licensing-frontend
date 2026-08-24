import { invoiceAddressPostcodeSearchRoutes } from '#src/server/marine-licence/invoicing/invoice-address-postcode-search/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('invoiceAddressPostcodeSearchRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(invoiceAddressPostcodeSearchRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(invoiceAddressPostcodeSearchRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
      })
    )
  })
})
