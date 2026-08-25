import { confirmAddressRoutes } from '#src/server/marine-licence/invoicing/confirm-address/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('confirmAddressRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(confirmAddressRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(confirmAddressRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS
      })
    )
  })
})
