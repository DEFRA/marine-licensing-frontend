import { vi } from 'vitest'
import { journeySelfServiceStart } from '#src/server/journey/self-service/start/index.js'

describe('journey self-service start route', () => {
  test('route is registered correctly', () => {
    const server = { route: vi.fn() }

    journeySelfServiceStart.plugin.register(server)

    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({
        method: 'GET',
        path: '/journey/self-service/start',
        options: {
          auth: false
        }
      })
    ])
  })
})
