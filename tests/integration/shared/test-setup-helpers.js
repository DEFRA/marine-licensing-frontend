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
} from '~/src/server/common/helpers/exemptions/session-cache/utils.js'
import {
  authenticatedGetRequest,
  authenticatedPatchRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import {
  getMcmsContextFromCache,
  clearMcmsContextCache
} from '~/src/server/common/helpers/mcms-context/cache-mcms-context.js'
import {
  clearMarineLicenceCache,
  getMarineLicenceCache,
  setMarineLicenceCache
} from '~/src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockExemptionMcmsContext as mockExemptionMcmsContextMock } from '~/tests/integration/shared/test-setup-helpers.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/helpers/mcms-context/cache-mcms-context.js')
vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
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

export const mockExemption = (e) => {
  vi.mocked(getExemptionCache).mockImplementation(() => {
    if (e?.constructor === Error) {
      throw e
    }
    return e
  })
  vi.mocked(setExemptionCache).mockResolvedValue(undefined)
  vi.mocked(updateExemptionSiteDetails).mockResolvedValue(undefined)
  vi.mocked(clearExemptionCache).mockResolvedValue(undefined)
  vi.mocked(authenticatedPatchRequest).mockResolvedValue({
    payload: { id: e?.id, siteDetails: e?.siteDetails }
  })
  vi.mocked(authenticatedGetRequest).mockResolvedValue({
    payload: { message: 'success', value: e }
  })
  vi.mocked(updateExemptionMultipleSiteDetails).mockResolvedValue({})
  vi.mocked(resetExemptionSiteDetails).mockResolvedValue(undefined)
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

export const mockExemptions = (exemptions) => {
  vi.mocked(authenticatedGetRequest).mockResolvedValue({
    payload: { message: 'success', value: exemptions }
  })
}

export const mockEmployeeExemptions = (exemptions) => {
  vi.mocked(authenticatedGetRequest).mockResolvedValue({
    payload: { message: 'success', value: exemptions, isEmployee: true }
  })
}

export const mockExemptionMcmsContext = (
  context = mockExemptionMcmsContextMock
) => {
  vi.mocked(getMcmsContextFromCache).mockReturnValue(context)
  vi.mocked(clearMcmsContextCache).mockReturnValue(undefined)
  return {
    getMcmsContextFromCache,
    clearMcmsContextCache
  }
}

const DEFAULT_TEST_SLUG = 'abcdefghijklmnopqrstuv'

/**
 * Configure the iat-context-service mocks for IAT integration tests.
 * Pass in the mocked iatContextService (each test file does its own
 * vi.mock for hoisting) and an optional config object.
 *
 * Returns: { slug, state, journeyUrl(path) }
 */
export const mockIatContext = (
  iatContextService,
  { slug = DEFAULT_TEST_SLUG, questionLog = [] } = {}
) => {
  const state = { slug, questionLog: [...questionLog] }
  vi.mocked(iatContextService.create).mockResolvedValue(slug)
  vi.mocked(iatContextService.get).mockImplementation(() =>
    Promise.resolve({ slug: state.slug, questionLog: [...state.questionLog] })
  )
  vi.mocked(iatContextService.patch).mockImplementation(
    (_req, _slug, answer) => {
      const idx = state.questionLog.findIndex(
        (e) => e.questionRoute === answer.questionRoute
      )
      const entry = { ...answer, answeredAt: new Date() }
      if (idx === -1) {
        state.questionLog = [...state.questionLog, entry]
      } else {
        state.questionLog = [...state.questionLog.slice(0, idx), entry]
      }
      return Promise.resolve({ questionLogLength: state.questionLog.length })
    }
  )
  return {
    slug,
    state,
    journeyUrl: (path) =>
      `/journey/self-service/c/${slug}${path.startsWith('/') ? path : `/${path}`}`
  }
}

/**
 * Configure the iat-outcome-document-service mocks for IAT integration tests.
 * Pass in the mocked iatOutcomeDocumentService and a snapshot doc.
 */
export const mockOutcomeDocument = (iatOutcomeDocumentService, doc) => {
  vi.mocked(iatOutcomeDocumentService.mint).mockResolvedValue({
    slug: doc.slug,
    viewUrl: `/outcome-documents/${doc.slug}`,
    snapshot: doc
  })
  vi.mocked(iatOutcomeDocumentService.get).mockImplementation((_req, s) =>
    Promise.resolve(s === doc.slug ? doc : null)
  )
}

export const mockMarineLicence = (m) => {
  vi.mocked(getMarineLicenceCache).mockImplementation(() => {
    if (m?.constructor === Error) {
      throw m
    }
    return m
  })
  vi.mocked(setMarineLicenceCache).mockResolvedValue(undefined)
  vi.mocked(clearMarineLicenceCache).mockResolvedValue(undefined)
  const existingMock = vi
    .mocked(authenticatedGetRequest)
    .getMockImplementation()
  vi.mocked(authenticatedGetRequest).mockImplementation((request, endpoint) => {
    if (
      endpoint?.startsWith('/marine-licence/') ||
      endpoint?.startsWith('/projects')
    ) {
      return Promise.resolve({
        payload: {
          message: 'success',
          value: m
        }
      })
    }
    if (existingMock) {
      return existingMock(request, endpoint)
    }
    return Promise.resolve({
      payload: {
        message: 'success',
        value: m
      }
    })
  })
  return {
    clearMarineLicenceCache,
    getMarineLicenceCache,
    setMarineLicenceCache,
    authenticatedGetRequest
  }
}
