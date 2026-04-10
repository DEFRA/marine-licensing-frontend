import { publicRegisterRoutes } from '#src/server/marine-licence/public-register/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('publicRegisterRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(publicRegisterRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(publicRegisterRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
      })
    )
  })
})
