import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { createServer } from '~/src/server/index.js'
import {
  getExemptionCache,
  setExemptionCache,
  clearExemptionCache,
  updateExemptionSiteDetails,
  updateExemptionMultipleSiteDetails,
  resetExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  authenticatedPatchRequest,
  authenticatedGetRequest
} from '~/src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock(
  '~/src/server/common/plugins/auth/get-oidc-config.js',
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

export const responseToDocument = (response) => {
  return new JSDOM(response.result).window.document
}

export const validateResponse = (response, expectedStatus = 200) => {
  expect(response.statusCode).toBe(expectedStatus)
}

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

export const mockExemption = (mockExemption) => {
  vi.mocked(getExemptionCache).mockImplementation(() => {
    if (mockExemption?.constructor === Error) {
      throw mockExemption
    }
    return mockExemption
  })
  vi.mocked(setExemptionCache).mockImplementation(() => undefined)
  vi.mocked(authenticatedPatchRequest).mockResolvedValue({
    payload: { id: mockExemption?.id, siteDetails: mockExemption?.siteDetails }
  })
  vi.mocked(authenticatedGetRequest).mockResolvedValue({
    payload: { message: 'success', value: mockExemption }
  })
  vi.mocked(updateExemptionMultipleSiteDetails).mockReturnValue({})
  vi.mocked(resetExemptionSiteDetails).mockReturnValue(undefined)
  return {
    setExemptionCache,
    clearExemptionCache,
    updateExemptionSiteDetails,
    resetExemptionSiteDetails,
    updateExemptionMultipleSiteDetails,
    authenticatedGetRequest,
    authenticatedPatchRequest
  }
}
