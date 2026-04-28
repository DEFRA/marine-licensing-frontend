import { vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/data-quality.js')
vi.mock('#src/server/journey/self-service/services/journey-data.js')

import { journeySelfServiceDataQualityInit } from '#src/server/journey/self-service/services/data-quality-init.js'
import { runLoadTimeScan } from '#src/server/journey/self-service/services/data-quality.js'
import { getJourneyData } from '#src/server/journey/self-service/services/journey-data.js'

describe('#journeySelfServiceDataQualityInit', () => {
  test('exposes a Hapi plugin shape', () => {
    expect(journeySelfServiceDataQualityInit.plugin.name).toBe(
      'journeySelfServiceDataQualityInit'
    )
    expect(typeof journeySelfServiceDataQualityInit.plugin.register).toBe(
      'function'
    )
  })

  test('subscribes to the server start event and runs the scan once', () => {
    let registeredHandler = null
    const fakeJourney = {
      firstQuestionRoute: '/x',
      questions: [],
      outcomes: [],
      outcomeTypes: []
    }
    vi.mocked(getJourneyData).mockReturnValue(fakeJourney)

    const fakeLogger = { warn: vi.fn() }
    const server = {
      logger: fakeLogger,
      events: {
        on: vi.fn((event, handler) => {
          if (event === 'start') registeredHandler = handler
        })
      }
    }

    journeySelfServiceDataQualityInit.plugin.register(server)

    expect(server.events.on).toHaveBeenCalledWith('start', expect.any(Function))
    registeredHandler()

    expect(runLoadTimeScan).toHaveBeenCalledTimes(1)
    expect(runLoadTimeScan).toHaveBeenCalledWith(fakeLogger, fakeJourney)
  })
})
