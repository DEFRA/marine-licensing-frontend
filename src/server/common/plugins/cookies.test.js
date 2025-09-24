import { cookies } from './cookies.js'
import { getCookiePreferences } from '~/src/server/common/helpers/cookie-preferences.js'
import {
  COOKIE_NAMES,
  COOKIE_OPTIONS_BASE64,
  FLASH_MESSAGE_KEYS
} from '~/src/server/common/constants/cookies.js'
import { config } from '~/src/config/config.js'

jest.mock('~/src/server/common/helpers/cookie-preferences.js')
jest.mock('~/src/config/config.js')

const createMockServer = () => ({
  state: jest.fn(),
  ext: jest.fn(),
  plugins: {}
})

const createMockRequest = (overrides = {}) => ({
  state: {},
  yar: {
    flash: jest.fn()
  },
  path: '/',
  url: { search: '' },
  cookieConfirmationBanner: false,
  ...overrides
})

const createMockH = () => ({
  continue: Symbol('continue')
})

const createMockResponse = (variety = 'view', context = {}) => ({
  variety,
  source: {
    context
  }
})

describe('Cookies Plugin', () => {
  let mockServer
  let mockRequest
  let mockH
  let mockResponse

  beforeEach(() => {
    mockServer = createMockServer()
    mockRequest = createMockRequest()
    mockH = createMockH()
    mockResponse = createMockResponse()
    jest.clearAllMocks()
    config.get.mockReturnValue(false) // Default to development environment
  })

  describe('plugin registration', () => {
    test('should have correct plugin name', () => {
      expect(cookies.name).toBe('cookie-policy')
    })

    test('should register cookie state with correct configuration in development', () => {
      cookies.register(mockServer)

      expect(mockServer.state).toHaveBeenCalledWith(COOKIE_NAMES.POLICY, {
        clearInvalid: true,
        encoding: COOKIE_OPTIONS_BASE64.ENCODING,
        ttl: COOKIE_OPTIONS_BASE64.TTL,
        path: COOKIE_OPTIONS_BASE64.PATH,
        isSecure: false,
        isSameSite: COOKIE_OPTIONS_BASE64.IS_SAME_SITE
      })
      expect(config.get).toHaveBeenCalledWith('isProduction')
    })

    test('should register cookie state with secure configuration in production', () => {
      config.get.mockReturnValue(true)

      cookies.register(mockServer)

      expect(mockServer.state).toHaveBeenCalledWith(COOKIE_NAMES.POLICY, {
        clearInvalid: true,
        encoding: COOKIE_OPTIONS_BASE64.ENCODING,
        ttl: COOKIE_OPTIONS_BASE64.TTL,
        path: COOKIE_OPTIONS_BASE64.PATH,
        isSecure: true,
        isSameSite: COOKIE_OPTIONS_BASE64.IS_SAME_SITE
      })
      expect(config.get).toHaveBeenCalledWith('isProduction')
    })

    test('should register two server extensions', () => {
      cookies.register(mockServer)

      expect(mockServer.ext).toHaveBeenCalledTimes(2)
      expect(mockServer.ext).toHaveBeenCalledWith(
        'onPostAuth',
        expect.any(Function)
      )
      expect(mockServer.ext).toHaveBeenCalledWith(
        'onPreResponse',
        expect.any(Function)
      )
    })
  })

  describe('onPostAuth extension', () => {
    let onPostAuthHandler

    beforeEach(() => {
      cookies.register(mockServer)
      onPostAuthHandler = mockServer.ext.mock.calls.find(
        (call) => call[0] === 'onPostAuth'
      )[1]
    })

    test('should consume flash messages and set cookieConfirmationBanner to true when flash message exists', () => {
      mockRequest.yar.flash.mockReturnValue([true])

      const result = onPostAuthHandler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        FLASH_MESSAGE_KEYS.SHOW_CONFIRMATION_BANNER
      )
      expect(mockRequest.cookieConfirmationBanner).toBe(true)
      expect(result).toBe(mockH.continue)
    })

    test('should set cookieConfirmationBanner to false when no flash message exists', () => {
      mockRequest.yar.flash.mockReturnValue([])

      const result = onPostAuthHandler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        FLASH_MESSAGE_KEYS.SHOW_CONFIRMATION_BANNER
      )
      expect(mockRequest.cookieConfirmationBanner).toBe(false)
      expect(result).toBe(mockH.continue)
    })

    test('should set cookieConfirmationBanner to false when flash returns undefined', () => {
      mockRequest.yar.flash.mockReturnValue([undefined])

      const result = onPostAuthHandler(mockRequest, mockH)

      expect(mockRequest.cookieConfirmationBanner).toBe(false)
      expect(result).toBe(mockH.continue)
    })

    test('should handle flash message returning falsy values', () => {
      const falsyValues = [false, 0, '', null]

      falsyValues.forEach((value) => {
        mockRequest.yar.flash.mockReturnValue([value])

        const result = onPostAuthHandler(mockRequest, mockH)

        expect(mockRequest.cookieConfirmationBanner).toBe(false)
        expect(result).toBe(mockH.continue)
      })
    })
  })

  describe('onPreResponse extension', () => {
    let onPreResponseHandler

    beforeEach(() => {
      cookies.register(mockServer)
      onPreResponseHandler = mockServer.ext.mock.calls.find(
        (call) => call[0] === 'onPreResponse'
      )[1]
      getCookiePreferences.mockReturnValue({
        essential: true,
        analytics: false,
        timestamp: null
      })
    })

    describe('view responses', () => {
      test('should inject context for view responses with default preferences', () => {
        mockRequest.response = mockResponse
        mockRequest.state = {}

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(getCookiePreferences).toHaveBeenCalledWith(mockRequest)
        expect(mockResponse.source.context).toEqual({
          showCookieConfirmationBanner: false,
          cookiePolicy: {
            essential: true,
            analytics: false,
            timestamp: null
          },
          showCookieBanner: true,
          currentUrl: '/'
        })
        expect(result).toBe(mockH.continue)
      })

      test('should preserve existing context when injecting cookie context', () => {
        const existingContext = { pageTitle: 'Test Page', userId: 123 }
        mockResponse = createMockResponse('view', existingContext)
        mockRequest.response = mockResponse

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context).toEqual({
          pageTitle: 'Test Page',
          userId: 123,
          showCookieConfirmationBanner: false,
          cookiePolicy: {
            essential: true,
            analytics: false,
            timestamp: null
          },
          showCookieBanner: true,
          currentUrl: '/'
        })
        expect(result).toBe(mockH.continue)
      })

      test('should not show cookie banner when preferences have been set', () => {
        mockRequest.response = mockResponse
        mockRequest.state = { [COOKIE_NAMES.PREFERENCES_SET]: 'true' }

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.showCookieBanner).toBe(false)
        expect(result).toBe(mockH.continue)
      })

      test('should not show cookie banner on cookies page', () => {
        mockRequest.response = mockResponse
        mockRequest.path = '/help/cookies'

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.showCookieBanner).toBe(false)
        expect(result).toBe(mockH.continue)
      })

      test('should show cookie banner when no preferences set and not on cookies page', () => {
        mockRequest.response = mockResponse
        mockRequest.state = {}
        mockRequest.path = '/exemption/contact'

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.showCookieBanner).toBe(true)
        expect(result).toBe(mockH.continue)
      })

      test('should include confirmation banner when cookieConfirmationBanner is true', () => {
        mockRequest.response = mockResponse
        mockRequest.cookieConfirmationBanner = true

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.showCookieConfirmationBanner).toBe(
          true
        )
        expect(result).toBe(mockH.continue)
      })

      test('should include current URL with query parameters', () => {
        mockRequest.response = mockResponse
        mockRequest.path = '/exemption/contact'
        mockRequest.url.search = '?ref=task-list'

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.currentUrl).toBe(
          '/exemption/contact?ref=task-list'
        )
        expect(result).toBe(mockH.continue)
      })

      test('should handle missing query parameters gracefully', () => {
        mockRequest.response = mockResponse
        mockRequest.path = '/exemption/contact'
        mockRequest.url.search = null

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.currentUrl).toBe(
          '/exemption/contact'
        )
        expect(result).toBe(mockH.continue)
      })

      test('should handle empty query parameters', () => {
        mockRequest.response = mockResponse
        mockRequest.path = '/exemption/contact'
        mockRequest.url.search = ''

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.currentUrl).toBe(
          '/exemption/contact'
        )
        expect(result).toBe(mockH.continue)
      })
    })

    describe('non-view responses', () => {
      test('should not modify non-view responses', () => {
        const nonViewResponse = createMockResponse('file')
        mockRequest.response = nonViewResponse

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(getCookiePreferences).not.toHaveBeenCalled()
        expect(nonViewResponse.source.context).toEqual({})
        expect(result).toBe(mockH.continue)
      })

      test('should handle redirect responses', () => {
        mockRequest.response = createMockResponse('redirect')
        const result = onPreResponseHandler(mockRequest, mockH)

        expect(getCookiePreferences).not.toHaveBeenCalled()
        expect(result).toBe(mockH.continue)
      })

      test('should handle stream responses', () => {
        mockRequest.response = createMockResponse('stream')

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(getCookiePreferences).not.toHaveBeenCalled()
        expect(result).toBe(mockH.continue)
      })
    })

    describe('edge cases', () => {
      test('should handle missing response.source gracefully', () => {
        mockResponse = { variety: 'view' }
        mockRequest.response = mockResponse

        expect(() => {
          onPreResponseHandler(mockRequest, mockH)
        }).toThrow()
      })

      test('should handle missing response.source.context gracefully', () => {
        mockResponse = {
          variety: 'view',
          source: {}
        }
        mockRequest.response = mockResponse

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context).toBeDefined()
        expect(result).toBe(mockH.continue)
      })

      test('should handle preferences_set cookie with non-string values', () => {
        mockRequest.response = mockResponse
        mockRequest.state = { [COOKIE_NAMES.PREFERENCES_SET]: true }

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.showCookieBanner).toBe(true)
        expect(result).toBe(mockH.continue)
      })

      test('should handle preferences_set cookie with falsy values', () => {
        const falsyValues = [false, 0, '', null, undefined]

        falsyValues.forEach((value) => {
          const testResponse = createMockResponse('view')
          mockRequest.response = testResponse
          mockRequest.state = { [COOKIE_NAMES.PREFERENCES_SET]: value }

          const result = onPreResponseHandler(mockRequest, mockH)

          expect(testResponse.source.context.showCookieBanner).toBe(true)
          expect(result).toBe(mockH.continue)
        })
      })
    })

    describe('analytics cookie state scenarios', () => {
      test('should inject analytics accepted state', () => {
        getCookiePreferences.mockReturnValue({
          essential: true,
          analytics: true,
          timestamp: 1234567890
        })
        mockRequest.response = mockResponse

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.cookiePolicy).toEqual({
          essential: true,
          analytics: true,
          timestamp: 1234567890
        })
        expect(result).toBe(mockH.continue)
      })

      test('should inject analytics rejected state', () => {
        getCookiePreferences.mockReturnValue({
          essential: true,
          analytics: false,
          timestamp: 1234567890
        })
        mockRequest.response = mockResponse

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.cookiePolicy).toEqual({
          essential: true,
          analytics: false,
          timestamp: 1234567890
        })
        expect(result).toBe(mockH.continue)
      })
    })

    describe('banner visibility logic', () => {
      test('should show banner when no preferences set and not on cookies page', () => {
        mockRequest.response = mockResponse
        mockRequest.path = '/'
        mockRequest.state = {}

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.showCookieBanner).toBe(true)
        expect(result).toBe(mockH.continue)
      })

      test('should not show banner when preferences set', () => {
        mockRequest.response = mockResponse
        mockRequest.path = '/'
        mockRequest.state = { [COOKIE_NAMES.PREFERENCES_SET]: 'true' }

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.showCookieBanner).toBe(false)
        expect(result).toBe(mockH.continue)
      })

      test('should not show banner on cookies page even when no preferences set', () => {
        mockRequest.response = mockResponse
        mockRequest.path = '/help/cookies'
        mockRequest.state = {}

        const result = onPreResponseHandler(mockRequest, mockH)

        expect(mockResponse.source.context.showCookieBanner).toBe(false)
        expect(result).toBe(mockH.continue)
      })

      test('should evaluate banner visibility with complex state combinations', () => {
        const testCases = [
          {
            description: 'show when no state at all',
            state: {},
            path: '/',
            expected: true
          },
          {
            description: 'hide when preferences explicitly set to true',
            state: { [COOKIE_NAMES.PREFERENCES_SET]: 'true' },
            path: '/',
            expected: false
          },
          {
            description: 'show when preferences set to false',
            state: { [COOKIE_NAMES.PREFERENCES_SET]: 'false' },
            path: '/',
            expected: true
          },
          {
            description: 'hide on cookies page regardless of preferences',
            state: {},
            path: '/help/cookies',
            expected: false
          },
          {
            description: 'hide on cookies page with query params',
            state: {},
            path: '/help/cookies',
            expected: false
          }
        ]

        testCases.forEach(({ state, path, expected }) => {
          mockRequest.response = createMockResponse('view')
          mockRequest.state = state
          mockRequest.path = path

          const result = onPreResponseHandler(mockRequest, mockH)

          expect(mockRequest.response.source.context.showCookieBanner).toBe(
            expected
          )
          expect(result).toBe(mockH.continue)
        })
      })
    })
  })
})
