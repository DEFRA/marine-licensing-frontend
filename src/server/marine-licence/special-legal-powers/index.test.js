import { specialLegalPowersRoutes } from '#src/server/marine-licence/special-legal-powers/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('specialLegalPowersRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(specialLegalPowersRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(specialLegalPowersRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS
      })
    )
  })
})
