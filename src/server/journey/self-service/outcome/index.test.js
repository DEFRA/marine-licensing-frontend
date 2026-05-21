import { vi } from 'vitest'
import { journeySelfServiceOutcome } from '#src/server/journey/self-service/outcome/index.js'

describe('journey self-service outcome route', () => {
  test('registers GET and POST on IAT_OUTCOME and the view-answers GET, all with auth disabled', () => {
    const server = { route: vi.fn() }

    journeySelfServiceOutcome.plugin.register(server)

    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({
        method: 'GET',
        path: '/journey/self-service/outcome/{outcomePath*}',
        options: expect.objectContaining({ auth: false })
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/journey/self-service/outcome/{outcomePath*}',
        options: expect.objectContaining({ auth: false })
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/journey/self-service/view-answers/{outcomeTypeId}/{outcomePath*}',
        options: expect.objectContaining({ auth: false })
      })
    ])
  })
})
