import Http from 'node:http'
import Https from 'node:https'
import Wreck from '@hapi/wreck'
import { config } from '#src/config/config.js'
import { setupProxy } from '#src/server/common/helpers/proxy/setup-proxy.js'

describe('setupProxy', () => {
  const originalHttpAgent = Wreck.agents.http
  const originalHttpsAgent = Wreck.agents.https

  afterEach(() => {
    config.set('httpProxy', null)
    Wreck.agents.http = originalHttpAgent
    Wreck.agents.https = originalHttpsAgent
  })

  test('Should not setup proxy if the environment variable is not set', () => {
    config.set('httpProxy', null)
    setupProxy()

    expect(Wreck.agents.http).not.toBe(Http.globalAgent)
    expect(Wreck.agents.https).not.toBe(Https.globalAgent)
  })

  test('Should setup proxy if the environment variable is set', () => {
    config.set('httpProxy', 'http://localhost:8080')
    setupProxy()

    expect(Wreck.agents.http).toBe(Http.globalAgent)
    expect(Wreck.agents.https).toBe(Https.globalAgent)
  })
})
