import { publicRegisterRoutes } from '~/src/server/exemption/public-register/index.js'

describe('publicRegisterRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(publicRegisterRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/public-register'
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(publicRegisterRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/public-register'
      })
    )
  })
})
