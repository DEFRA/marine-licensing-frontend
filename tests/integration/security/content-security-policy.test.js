import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { routes } from '~/src/server/common/constants/routes.js'

const NONCE_IN_HEADER = /'nonce-([a-f0-9]{32})'/
const NONCE_IN_HTML = /nonce=["']([a-f0-9]{32})["']/

describe('Content-Security-Policy header on real responses', () => {
  const getServer = setupTestServer()

  test('is present and its nonce matches the nonce rendered into the page', async () => {
    const response = await makeGetRequest({
      server: getServer(),
      url: routes.COOKIES
    })

    const header = response.headers['content-security-policy']
    expect(header).toContain("frame-ancestors 'none'")

    const [, headerNonce] = header.match(NONCE_IN_HEADER)
    const [, htmlNonce] = response.result.match(NONCE_IN_HTML)
    expect(htmlNonce).toBe(headerNonce)
  })

  test('changes the nonce on every response', async () => {
    const first = await makeGetRequest({
      server: getServer(),
      url: routes.COOKIES
    })
    const second = await makeGetRequest({
      server: getServer(),
      url: routes.COOKIES
    })

    const [, firstNonce] =
      first.headers['content-security-policy'].match(NONCE_IN_HEADER)
    const [, secondNonce] =
      second.headers['content-security-policy'].match(NONCE_IN_HEADER)
    expect(firstNonce).not.toBe(secondNonce)
  })
})
