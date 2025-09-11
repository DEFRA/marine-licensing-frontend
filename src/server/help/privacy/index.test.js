import { privacyRoutes } from '~/src/server/help/privacy/index.js'

describe('privacy route', () => {
  test('route is registered correctly', () => {
    expect(privacyRoutes).toEqual([
      expect.objectContaining({
        method: 'GET',
        path: '/help/privacy',
        options: {
          auth: false
        }
      })
    ])
  })
})
