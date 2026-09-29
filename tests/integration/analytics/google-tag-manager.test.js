import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { config } from '~/src/config/config.js'

const CONTAINER_ID = 'GTM-TEST123'

const overrides = vi.hoisted(() => ({ googleTagManagerKey: 'GTM-TEST123' }))

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

const gtmScript = (document) =>
  Array.from(document.head.querySelectorAll('script')).find((script) =>
    script.textContent.includes('googletagmanager.com/gtm.js')
  )

const gtmIframe = (document) =>
  document.body.querySelector(
    'noscript iframe[src*="googletagmanager.com/ns.html"]'
  )

describe('Google Tag Manager snippets', () => {
  const getServer = setupTestServer()

  beforeEach(async () => {
    const actualConfig = await vi.importActual('~/src/config/config.js')
    overrides.googleTagManagerKey = CONTAINER_ID
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
    return { response, document: new JSDOM(response.result).window.document }
  }

  describe('when analytics cookies are accepted', () => {
    test('renders Part A in the head with the container ID and the CSP nonce', async () => {
      const { response, document } = await load({ cookie: cookieHeader(true) })

      const script = gtmScript(document)
      expect(script).toBeDefined()
      expect(script.textContent).toContain(`'${CONTAINER_ID}'`)
      expect(script.textContent).toContain("'dataLayer'")

      const [, headerNonce] = response.headers['content-security-policy'].match(
        /'nonce-([a-f0-9]{32})'/
      )
      expect(script.getAttribute('nonce')).toBe(headerNonce)
    })

    test('copies the nonce onto the injected gtm.js element so GTM can propagate it', async () => {
      const { document } = await load({ cookie: cookieHeader(true) })

      expect(gtmScript(document).textContent).toContain(
        "n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'))"
      )
    })

    test('renders Part B immediately after the govuk-frontend body script with a title and the hiding class', async () => {
      const { document } = await load({ cookie: cookieHeader(true) })

      const iframe = gtmIframe(document)
      expect(iframe).not.toBeNull()
      expect(iframe.getAttribute('src')).toBe(
        `https://www.googletagmanager.com/ns.html?id=${CONTAINER_ID}`
      )
      expect(iframe.getAttribute('title')).toBe('Google Tag Manager')
      expect(iframe.classList.contains('app-gtm-noscript')).toBe(true)
      expect(iframe.hasAttribute('style')).toBe(false)
      // govuk-frontend's own inline script is the first child of <body>; bodyStart renders next
      const [first, second] = document.body.children
      expect(first.tagName).toBe('SCRIPT')
      expect(second.tagName).toBe('NOSCRIPT')
      expect(second.contains(iframe)).toBe(true)
    })

    test('renders each snippet exactly once', async () => {
      const { response } = await load({ cookie: cookieHeader(true) })

      expect(
        response.result.match(/googletagmanager\.com\/gtm\.js/g)
      ).toHaveLength(1)
      expect(
        response.result.match(/googletagmanager\.com\/ns\.html/g)
      ).toHaveLength(1)
    })

    test('the CSP allows the Google hosts', async () => {
      const { response } = await load({ cookie: cookieHeader(true) })

      expect(response.headers['content-security-policy']).toContain(
        "frame-src 'self' https://www.googletagmanager.com"
      )
    })
  })

  test.each([
    { label: 'rejected', headers: { cookie: cookieHeader(false) } },
    { label: 'undecided', headers: {} }
  ])(
    'renders neither snippet when analytics cookies are $label',
    async ({ headers }) => {
      const { response, document } = await load(headers)

      expect(gtmScript(document)).toBeUndefined()
      expect(gtmIframe(document)).toBeNull()
      expect(response.result).not.toContain('googletagmanager.com')
    }
  )

  test('renders neither snippet when no container key is configured, even with consent', async () => {
    overrides.googleTagManagerKey = ''

    const { response, document } = await load({ cookie: cookieHeader(true) })

    expect(gtmScript(document)).toBeUndefined()
    expect(gtmIframe(document)).toBeNull()
    expect(response.result).not.toContain('googletagmanager.com')
  })

  test('is rendered on the 404 page for a consenting user', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: '/this-page-does-not-exist-for-testing',
      headers: { cookie: cookieHeader(true) }
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
    const document = new JSDOM(response.result).window.document
    expect(gtmScript(document)).toBeDefined()
    expect(response.headers['content-security-policy']).toContain(
      'googletagmanager.com'
    )
  })
})
