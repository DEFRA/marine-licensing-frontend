import { harbourAuthorityRoutes } from '#src/server/marine-licence/harbour-authority/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('harbourAuthorityRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(harbourAuthorityRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(harbourAuthorityRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY
      })
    )
  })
})
