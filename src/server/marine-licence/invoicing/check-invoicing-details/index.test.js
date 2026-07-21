import { checkInvoicingDetailsRoutes } from '#src/server/marine-licence/invoicing/check-invoicing-details/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('checkInvoicingDetailsRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(checkInvoicingDetailsRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(checkInvoicingDetailsRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
      })
    )
  })
})
