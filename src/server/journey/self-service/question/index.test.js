import { vi } from 'vitest'
import { journeySelfServiceQuestion } from '#src/server/journey/self-service/question/index.js'

describe('journey self-service question route', () => {
  test('registers GET and POST routes correctly', () => {
    const server = { route: vi.fn() }

    journeySelfServiceQuestion.plugin.register(server)

    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({
        method: 'GET',
        path: '/journey/self-service/{questionPath*}',
        options: expect.objectContaining({ auth: false })
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/journey/self-service/{questionPath*}',
        options: expect.objectContaining({ auth: false })
      })
    ])
  })
})
