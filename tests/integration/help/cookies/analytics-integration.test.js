import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { config } from '~/src/config/config.js'

import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

jest.mock('~/src/config/config.js', () => {
  const actualConfig = jest.requireActual('~/src/config/config.js')
  return {
    config: {
      ...actualConfig.config,
      get: jest.fn((key) => {
        // Mock clarityProjectId specifically
        if (key === 'clarityProjectId') {
          return 'test-clarity-id-123'
        }
        // Use the actual config for all other keys
        return actualConfig.config.get(key)
      })
    }
  }
})

describe('MS Clarity Analytics Integration', () => {
  const getServer = setupTestServer()
  const CLARITY_PROJECT_ID = 'test-clarity-id-123'

  beforeEach(() => {
    config.get.mockImplementation((key) => {
      if (key === 'clarityProjectId') {
        return CLARITY_PROJECT_ID
      }
      const actualConfig = jest.requireActual('~/src/config/config.js')
      return actualConfig.config.get(key)
    })
  })

  const createCookieHeaders = (acceptAnalytics = false) => {
    const cookiesPolicy = {
      essential: true,
      analytics: acceptAnalytics,
      timestamp: Math.floor(Date.now() / 1000)
    }
    const policyHeader = `cookies_policy=${Buffer.from(
      JSON.stringify(cookiesPolicy)
    ).toString('base64')}`
    const preferencesHeader = 'cookies_preferences_set=true'
    return `${policyHeader}; ${preferencesHeader}`
  }

  const checkClarityScript = (document) => {
    const scripts = Array.from(document.querySelectorAll('script'))
    return scripts.some((script) =>
      script.textContent?.includes('window.CLARITY_PROJECT_ID')
    )
  }

  const getClarityProjectId = (document) => {
    const scripts = Array.from(document.querySelectorAll('script'))
    const clarityScript = scripts.find((script) =>
      script.textContent?.includes('window.CLARITY_PROJECT_ID')
    )
    if (!clarityScript) return null

    const match = clarityScript.textContent.match(
      /window\.CLARITY_PROJECT_ID\s*=\s*"([^"]*)"/
    )
    return match ? match[1] : null
  }

  const getAnalyticsEnabled = (document) => {
    const scripts = Array.from(document.querySelectorAll('script'))
    const clarityScript = scripts.find((script) =>
      script.textContent?.includes('window.ANALYTICS_ENABLED')
    )
    if (!clarityScript) return null

    const match = clarityScript.textContent.match(
      /window\.ANALYTICS_ENABLED\s*=\s*(true|false)/
    )
    return match ? match[1] === 'true' : null
  }

  describe('Cookies page analytics integration', () => {
    test('Should include MS Clarity when analytics cookies are REJECTED (to allow consent withdrawal)', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: {
          cookie: createCookieHeaders(false)
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      // Clarity should be present to handle consent withdrawal
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe('test-clarity-id-123')

      // Analytics should be disabled in the context
      expect(getAnalyticsEnabled(document)).toBe(false)
    })

    test('Should include MS Clarity with correct Project ID when analytics cookies are ACCEPTED', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: {
          cookie: createCookieHeaders(true)
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      expect(checkClarityScript(document)).toBe(true)
      const projectId = getClarityProjectId(document)
      expect(projectId).toBe(CLARITY_PROJECT_ID)
    })

    test('Should include MS Clarity by default (no cookie preference) to handle initial consent', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      // Clarity should be present to handle initial consent setting
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe('test-clarity-id-123')

      // Analytics should be disabled by default
      expect(getAnalyticsEnabled(document)).toBe(false)
    })

    test('Should handle empty CLARITY_PROJECT_ID gracefully', async () => {
      config.get.mockImplementation((key) => {
        if (key === 'clarityProjectId') {
          return ''
        }
        const actualConfig = jest.requireActual('~/src/config/config.js')
        return actualConfig.config.get(key)
      })

      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: {
          cookie: createCookieHeaders(true)
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      // Script should not be present when project ID is empty
      expect(checkClarityScript(document)).toBe(false)
    })

    test('Should handle missing CLARITY_PROJECT_ID config', async () => {
      // Mock undefined project ID
      config.get.mockImplementation((key) => {
        if (key === 'clarityProjectId') {
          return undefined
        }
        const actualConfig = jest.requireActual('~/src/config/config.js')
        return actualConfig.config.get(key)
      })

      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: {
          cookie: createCookieHeaders(true)
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      // Script should not be present when project ID is undefined
      expect(checkClarityScript(document)).toBe(false)
    })
  })

  describe('Cookie preference workflow', () => {
    test('Should include MS Clarity with correct analytics state throughout preference workflow', async () => {
      // First request: No cookies, should include Clarity with analytics disabled
      const firstResponse = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies'
      })

      let document = new JSDOM(firstResponse.result).window.document
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe('test-clarity-id-123')
      expect(getAnalyticsEnabled(document)).toBe(false)

      // Accept analytics cookies
      const acceptResponse = await makePostRequest({
        server: getServer(),
        formData: 'analytics=yes&csrfToken=',
        url: '/help/cookies',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      expect(acceptResponse.statusCode).toBe(statusCodes.redirect)

      // Extract cookies from response
      const setCookieHeaders = acceptResponse.headers['set-cookie']
      const cookies = Array.isArray(setCookieHeaders)
        ? setCookieHeaders.join('; ')
        : setCookieHeaders

      // Second request: With analytics accepted, should include Clarity with analytics enabled
      const secondResponse = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: {
          cookie: cookies
        }
      })

      document = new JSDOM(secondResponse.result).window.document
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe(CLARITY_PROJECT_ID)
      expect(getAnalyticsEnabled(document)).toBe(true)

      // Reject analytics cookies
      const rejectResponse = await makePostRequest({
        server: getServer(),
        url: '/help/cookies',
        formData: 'analytics=no&csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: cookies
        }
      })

      expect(rejectResponse.statusCode).toBe(statusCodes.redirect)

      // Extract updated cookies
      const updatedCookies = Array.isArray(rejectResponse.headers['set-cookie'])
        ? rejectResponse.headers['set-cookie'].join('; ')
        : rejectResponse.headers['set-cookie']

      // Third request: With analytics rejected, should still include Clarity but with analytics disabled
      const thirdResponse = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: {
          cookie: updatedCookies
        }
      })

      document = new JSDOM(thirdResponse.result).window.document
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe(CLARITY_PROJECT_ID)
      expect(getAnalyticsEnabled(document)).toBe(false)
    })
  })

  describe('Other pages with analytics', () => {
    test('Should include MS Clarity with correct analytics state on privacy page', async () => {
      // Test with analytics rejected - Clarity should be present but analytics disabled
      let response = await makeGetRequest({
        server: getServer(),
        url: '/help/privacy',
        headers: {
          cookie: createCookieHeaders(false)
        }
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      let document = new JSDOM(response.result).window.document
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe('test-clarity-id-123')
      expect(getAnalyticsEnabled(document)).toBe(false)

      // Test with analytics accepted - Clarity should be present with analytics enabled
      response = await makeGetRequest({
        server: getServer(),
        url: '/help/privacy',
        headers: {
          cookie: createCookieHeaders(true)
        }
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      document = new JSDOM(response.result).window.document
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe(CLARITY_PROJECT_ID)
      expect(getAnalyticsEnabled(document)).toBe(true)
    })
  })
})
