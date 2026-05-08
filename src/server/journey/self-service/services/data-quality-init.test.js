import { vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/data-quality.js')
vi.mock('#src/server/journey/self-service/services/journey-data.js')
vi.mock('#src/config/config.js', () => ({
  config: { get: vi.fn() }
}))

import { journeySelfServiceDataQualityInit } from '#src/server/journey/self-service/services/data-quality-init.js'
import { runLoadTimeScan } from '#src/server/journey/self-service/services/data-quality.js'
import { getJourneyData } from '#src/server/journey/self-service/services/journey-data.js'
import { config } from '#src/config/config.js'

function setDataQualityEnabled(enabled) {
  vi.mocked(config.get).mockImplementation((key) =>
    key === 'selfService.dataQualityEnabled' ? enabled : undefined
  )
}

function makeServer() {
  let registeredHandler = null
  const server = {
    logger: { warn: vi.fn() },
    events: {
      on: vi.fn((event, handler) => {
        if (event === 'start') registeredHandler = handler
      })
    }
  }
  return { server, runStart: () => registeredHandler() }
}

describe('#journeySelfServiceDataQualityInit', () => {
  test('exposes a Hapi plugin shape', () => {
    expect(journeySelfServiceDataQualityInit.plugin.name).toBe(
      'journeySelfServiceDataQualityInit'
    )
    expect(typeof journeySelfServiceDataQualityInit.plugin.register).toBe(
      'function'
    )
  })

  test('runs the scan on start when selfService.dataQualityEnabled is true', () => {
    const fakeJourney = {
      firstQuestionRoute: '/x',
      questions: [],
      outcomes: [],
      outcomeTypes: []
    }
    vi.mocked(getJourneyData).mockReturnValue(fakeJourney)
    setDataQualityEnabled(true)

    const { server, runStart } = makeServer()
    journeySelfServiceDataQualityInit.plugin.register(server)

    expect(server.events.on).toHaveBeenCalledWith('start', expect.any(Function))
    runStart()

    expect(runLoadTimeScan).toHaveBeenCalledTimes(1)
    expect(runLoadTimeScan).toHaveBeenCalledWith(server.logger, fakeJourney)
  })

  test('skips the scan on start when selfService.dataQualityEnabled is false', () => {
    setDataQualityEnabled(false)

    const { server, runStart } = makeServer()
    journeySelfServiceDataQualityInit.plugin.register(server)
    runStart()

    expect(runLoadTimeScan).not.toHaveBeenCalled()
  })
})
