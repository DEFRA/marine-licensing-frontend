import { preferredDatesRoutes } from '#src/server/marine-licence/preferred-dates/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('preferredDatesRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(preferredDatesRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(preferredDatesRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES
      })
    )
  })
})
