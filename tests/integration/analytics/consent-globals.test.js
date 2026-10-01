import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { config } from '~/src/config/config.js'

const overrides = vi.hoisted(() => ({
  googleTagManagerKey: 'GTM-TEST123',
  clarityProjectId: ''
}))

vi.mock('~/src/config/config.js', async () => {
  const actualConfig = await vi.importActual('~/src/config/config.js')
  return {
    config: {
      ...actualConfig.config,
      get: vi.fn((key) =>
        key in overrides ? overrides[key] : actualConfig.config.get(key)
      )
    }
  }
})

const cookieHeader = (analytics) => {
  const policy = Buffer.from(
    JSON.stringify({ essential: true, analytics, timestamp: 1 })
  ).toString('base64')
  return `cookies_policy=${policy}; cookies_preferences_set=true`
}

const globalsScript = (document) =>
  Array.from(document.querySelectorAll('script')).find((script) =>
    script.textContent.includes('window.ANALYTICS_ENABLED')
  )

describe('Analytics globals in the page head', () => {
  const getServer = setupTestServer()

  beforeEach(async () => {
    const actualConfig = await vi.importActual('~/src/config/config.js')
    overrides.googleTagManagerKey = 'GTM-TEST123'
    overrides.clarityProjectId = ''
    config.get.mockImplementation((key) =>
      key in overrides ? overrides[key] : actualConfig.config.get(key)
    )
  })

  const load = async (headers = {}) => {
    const response = await makeGetRequest({
      server: getServer(),
      url: routes.PRIVACY,
      headers
    })
    expect(response.statusCode).toBe(statusCodes.ok)
    return {
      response,
      script: globalsScript(new JSDOM(response.result).window.document)
    }
  }

  test('renders the globals with no Clarity ID and no consent cookie', async () => {
    const { script } = await load()

    expect(script).toBeDefined()
    expect(script.textContent).toContain('window.CLARITY_PROJECT_ID = ""')
    expect(script.textContent).toContain('window.ANALYTICS_ENABLED = false')
    expect(script.textContent).toContain(
      'window.COOKIE_PREFERENCES_SET = false'
    )
    expect(script.textContent).toContain('window.ENABLE_BROWSER_LOGGING = true')
  })

  test('carries the CSP nonce', async () => {
    const { response, script } = await load()

    const [, headerNonce] = response.headers['content-security-policy'].match(
      /'nonce-([a-f0-9]{32})'/
    )
    expect(script.getAttribute('nonce')).toBe(headerNonce)
  })

  test('reports accepted analytics and grants analytics storage through Consent Mode', async () => {
    const { script } = await load({ cookie: cookieHeader(true) })

    expect(script.textContent).toContain('window.ANALYTICS_ENABLED = true')
    expect(script.textContent).toContain('window.COOKIE_PREFERENCES_SET = true')
    expect(script.textContent).toContain(
      'window.dataLayer = window.dataLayer || []'
    )
    expect(script.textContent).toContain(
      'function gtag() { dataLayer.push(arguments); }'
    )
    expect(script.textContent).toContain("gtag('consent', 'default', {")
    expect(script.textContent).toContain("ad_storage: 'denied'")
    expect(script.textContent).toContain("analytics_storage: 'denied'")
    expect(script.textContent).toContain(
      "gtag('consent', 'update', { analytics_storage: 'granted' })"
    )
  })

  test('reports rejected analytics and leaves every consent type denied', async () => {
    const { script } = await load({ cookie: cookieHeader(false) })

    expect(script.textContent).toContain('window.ANALYTICS_ENABLED = false')
    expect(script.textContent).toContain('window.COOKIE_PREFERENCES_SET = true')
    expect(script.textContent).toContain("gtag('consent', 'default', {")
    expect(script.textContent).toContain("analytics_storage: 'denied'")
    expect(script.textContent).not.toContain("gtag('consent', 'update'")
  })

  test('issues no consent commands when no container key is configured', async () => {
    overrides.googleTagManagerKey = ''

    const { script } = await load({ cookie: cookieHeader(true) })

    expect(script.textContent).not.toContain('dataLayer')
    expect(script.textContent).not.toContain('gtag(')
  })

  test('renders the Clarity project ID as a JSON string', async () => {
    overrides.clarityProjectId = 'clarity-id-1'

    const { script } = await load()

    expect(script.textContent).toContain(
      'window.CLARITY_PROJECT_ID = "clarity-id-1"'
    )
  })

  test('does not emit a noscript style block', async () => {
    const { response } = await load()

    expect(response.result).not.toContain('.hide-if-no-js {display:none')
  })
})
