import { otherAuthoritiesRoutes } from '#src/server/marine-licence/other-authorities/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('otherAuthoritiesRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(otherAuthoritiesRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(otherAuthoritiesRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES
      })
    )
  })
})
