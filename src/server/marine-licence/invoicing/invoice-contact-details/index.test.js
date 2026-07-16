import { invoiceContactDetailsRoutes } from '#src/server/marine-licence/invoicing/invoice-contact-details/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('invoiceContactDetailsRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(invoiceContactDetailsRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(invoiceContactDetailsRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
      })
    )
  })
})
