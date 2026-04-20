import { vi } from 'vitest'
import { journeySelfServiceStart } from '#src/server/journey/self-service/start/index.js'

describe('journey self-service start route', () => {
  test('GET and POST routes are registered correctly', () => {
    const server = { route: vi.fn() }

    journeySelfServiceStart.plugin.register(server)

    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({
        method: 'GET',
        path: '/journey/self-service/start',
        options: {
          auth: false
        }
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/journey/self-service/start',
        options: {
          auth: false
        }
      })
    ])
  })
})
