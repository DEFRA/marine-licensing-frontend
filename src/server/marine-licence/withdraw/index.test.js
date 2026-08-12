import { withdrawMarineLicenceRoutes } from '#src/server/marine-licence/withdraw/index.js'

describe('withdrawMarineLicence routes', () => {
  test('routes are formatted correctly', () => {
    expect(withdrawMarineLicenceRoutes).toEqual([
      expect.objectContaining({
        method: 'GET',
        path: '/marine-licence/withdraw'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/marine-licence/withdraw/{marineLicenceId}'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/marine-licence/withdraw'
      })
    ])
  })
})
