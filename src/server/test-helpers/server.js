import { vi } from 'vitest'
import { createServer } from '#src/server/index.js'

vi.mock(
  '#src/server/common/plugins/auth/get-oidc-config.js',
  async (importOriginal) => {
    const mod = await importOriginal()
    return {
      ...mod,
      getOidcConfig: vi.fn().mockResolvedValue({
        issuer: 'http://localhost:3200/cdp-defra-id-stub',
        authorization_endpoint:
          'http://localhost:3200/cdp-defra-id-stub/authorize',
        token_endpoint: 'http://localhost:3200/cdp-defra-id-stub/token',
        jwks_uri:
          'http://localhost:3200/cdp-defra-id-stub/.well-known/jwks.json'
      })
    }
  }
)

export const setupTestServer = () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server?.stop()
  })

  return () => server
}
