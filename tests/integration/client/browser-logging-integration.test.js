import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { config } from '~/src/config/config.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

vi.mock('~/src/config/config.js', async () => {
  const actualConfig = await vi.importActual('~/src/config/config.js')
  const originalGet = actualConfig.config.get.bind(actualConfig.config)

  return {
    config: {
      ...actualConfig.config,
      get: vi.fn((key) => {
        if (key === 'enableBrowserLogging') {
          return true
        }
        return originalGet(key)
      })
    }
  }
})

const actualConfig = await vi.importActual('~/src/config/config.js')
const originalGet = actualConfig.config.get.bind(actualConfig.config)

describe('Browser Logging Integration', () => {
  const getServer = setupTestServer()
  let server

  beforeEach(async () => {
    server = getServer()
    config.get.mockImplementation((key) => {
      if (key === 'enableBrowserLogging') {
        return true
      }
      return originalGet(key)
    })
  })

  const createBrowserLogPayload = (overrides = {}) => ({
    type: 'js_error',
    message: 'Test error',
    timestamp: Date.now(),
    url: '/test-page',
    userAgent: 'Test Browser',
    ...overrides
  })

  describe('Browser logging configuration in HTML', () => {
    test('Should include ENABLE_BROWSER_LOGGING script when enabled', async () => {
      const { result, statusCode } = await makeGetRequest({
        server,
        url: '/help/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      const scripts = Array.from(document.querySelectorAll('script'))
      const loggingScript = scripts.find((script) =>
        script.textContent?.includes('window.ENABLE_BROWSER_LOGGING')
      )

      expect(loggingScript).toBeDefined()
      expect(loggingScript.textContent).toContain(
        'window.ENABLE_BROWSER_LOGGING = true'
      )
    })

    test('Should NOT include ENABLE_BROWSER_LOGGING script when disabled', async () => {
      config.get.mockImplementation((key) => {
        if (key === 'enableBrowserLogging') {
          return false
        }
        return originalGet(key)
      })

      const { result, statusCode } = await makeGetRequest({
        server,
        url: '/help/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      const scripts = Array.from(document.querySelectorAll('script'))
      const loggingScript = scripts.find((script) =>
        script.textContent?.includes('window.ENABLE_BROWSER_LOGGING')
      )

      expect(loggingScript).toBeUndefined()
    })
  })

  describe('Browser logging API endpoint', () => {
    test('Should accept browser error logs from authenticated users', async () => {
      const payload = createBrowserLogPayload({
        message: 'Test JavaScript error',
        userAgent: 'Mozilla/5.0 Test Browser',
        errorType: 'TypeError',
        stack: 'TypeError: Test error\n    at testFunction (test.js:10:5)'
      })

      const { statusCode } = await makePostRequest({
        server,
        url: '/api/browser-logs',
        payload,
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(statusCode).toBe(statusCodes.noContent)
    })

    test('Should redirect unauthenticated users to auth provider', async () => {
      const payload = createBrowserLogPayload()

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/api/browser-logs',
        payload,
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(statusCode).toBe(statusCodes.redirect)
    })

    test('Should process different types of browser events', async () => {
      const eventTypes = [
        { type: 'js_error', message: 'JavaScript error occurred' },
        {
          type: 'unhandled_promise',
          message: 'Promise rejection: Network error'
        },
        {
          type: 'console_error',
          message: 'Console error: Invalid configuration'
        }
      ]

      for (const event of eventTypes) {
        const payload = createBrowserLogPayload(event)

        const { statusCode } = await makePostRequest({
          server,
          url: '/api/browser-logs',
          payload,
          headers: {
            'content-type': 'application/json'
          }
        })

        expect(statusCode).toBe(statusCodes.noContent)
      }
    })

    test('Should handle browser logs when feature is disabled', async () => {
      config.get.mockImplementation((key) => {
        if (key === 'enableBrowserLogging') {
          return false
        }
        return originalGet(key)
      })

      const payload = createBrowserLogPayload()

      const { statusCode } = await makePostRequest({
        server,
        url: '/api/browser-logs',
        payload,
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(statusCode).toBe(statusCodes.notFound)
    })
  })
})
