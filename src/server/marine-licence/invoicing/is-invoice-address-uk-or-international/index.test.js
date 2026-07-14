import { isInvoiceAddressUkOrInternationalRoutes } from '#src/server/marine-licence/invoicing/is-invoice-address-uk-or-international/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('isInvoiceAddressUkOrInternationalRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(isInvoiceAddressUkOrInternationalRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(isInvoiceAddressUkOrInternationalRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
      })
    )
  })
})
