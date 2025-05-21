import { publicRegisterRoutes } from '~/src/server/exemption/public-register/index.js'
import { routes } from '~/src/server/common/constants/routes.js'

describe('publicRegisterRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(publicRegisterRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: routes.PUBLIC_REGISTER
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(publicRegisterRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: routes.PUBLIC_REGISTER
      })
    )
  })
})
