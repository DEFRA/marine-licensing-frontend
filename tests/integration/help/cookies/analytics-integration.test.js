import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { config } from '~/src/config/config.js'

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

  describe('Cookies page analytics integration', () => {
    test('Should NOT include MS Clarity when analytics cookies are REJECTED', async () => {
      const { result, statusCode } = await getServer().inject({
        method: 'GET',
        url: '/help/cookies',
        headers: {
          cookie: createCookieHeaders(false)
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      expect(checkClarityScript(document)).toBe(false)

      expect(getClarityProjectId(document)).toBeNull()

      // Verify no analytics-related scripts are included
      const scripts = Array.from(document.querySelectorAll('script'))
      const scriptContents = scripts
        .filter((script) => script.textContent)
        .map((script) => script.textContent)
        .join(' ')

      expect(scriptContents).not.toContain('CLARITY_PROJECT_ID')
    })

    test('Should include MS Clarity with correct Project ID when analytics cookies are ACCEPTED', async () => {
      const { result, statusCode } = await getServer().inject({
        method: 'GET',
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

    test('Should NOT include MS Clarity by default (no cookie preference)', async () => {
      const { result, statusCode } = await getServer().inject({
        method: 'GET',
        url: '/help/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      expect(checkClarityScript(document)).toBe(false)
    })

    test('Should handle empty CLARITY_PROJECT_ID gracefully', async () => {
      config.get.mockImplementation((key) => {
        if (key === 'clarityProjectId') {
          return ''
        }
        const actualConfig = jest.requireActual('~/src/config/config.js')
        return actualConfig.config.get(key)
      })

      const { result, statusCode } = await getServer().inject({
        method: 'GET',
        url: '/help/cookies',
        headers: {
          cookie: createCookieHeaders(true)
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      // Script should still be present but with empty project ID
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe('')
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

      const { result, statusCode } = await getServer().inject({
        method: 'GET',
        url: '/help/cookies',
        headers: {
          cookie: createCookieHeaders(true)
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      // Script should still be present but project ID should be empty string
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe('')
    })
  })

  describe('Cookie preference workflow', () => {
    test('Should dynamically include/exclude MS Clarity based on preference changes', async () => {
      // First request: No cookies, should not include Clarity
      const firstResponse = await getServer().inject({
        method: 'GET',
        url: '/help/cookies'
      })

      let document = new JSDOM(firstResponse.result).window.document
      expect(checkClarityScript(document)).toBe(false)

      // Accept analytics cookies
      const acceptResponse = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=yes&csrfToken=',
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

      // Second request: With analytics accepted, should include Clarity
      const secondResponse = await getServer().inject({
        method: 'GET',
        url: '/help/cookies',
        headers: {
          cookie: cookies
        }
      })

      document = new JSDOM(secondResponse.result).window.document
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe(CLARITY_PROJECT_ID)

      // Reject analytics cookies
      const rejectResponse = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=no&csrfToken=',
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

      // Third request: With analytics rejected, should not include Clarity
      const thirdResponse = await getServer().inject({
        method: 'GET',
        url: '/help/cookies',
        headers: {
          cookie: updatedCookies
        }
      })

      document = new JSDOM(thirdResponse.result).window.document
      expect(checkClarityScript(document)).toBe(false)
    })
  })

  describe('Other pages with analytics', () => {
    test('Should respect analytics preferences on privacy page', async () => {
      // Test with analytics rejected
      let response = await getServer().inject({
        method: 'GET',
        url: '/help/privacy',
        headers: {
          cookie: createCookieHeaders(false)
        }
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      let document = new JSDOM(response.result).window.document
      expect(checkClarityScript(document)).toBe(false)

      // Test with analytics accepted
      response = await getServer().inject({
        method: 'GET',
        url: '/help/privacy',
        headers: {
          cookie: createCookieHeaders(true)
        }
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      document = new JSDOM(response.result).window.document
      expect(checkClarityScript(document)).toBe(true)
      expect(getClarityProjectId(document)).toBe(CLARITY_PROJECT_ID)
    })
  })
})
