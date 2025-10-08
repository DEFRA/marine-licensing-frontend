import { vi } from 'vitest'
import {
  createCookiePolicy,
  setCookiePreferences,
  setConfirmationBanner
} from './cookie-service.js'
import {
  COOKIE_NAMES,
  COOKIE_OPTIONS,
  COOKIE_OPTIONS_BASE64,
  FLASH_MESSAGE_KEYS
} from '#src/server/common/constants/cookies.js'
import { config } from '#src/config/config.js'

vi.mock('~/src/config/config.js')

const createMockResponse = () => ({
  state: vi.fn().mockReturnThis()
})

const createMockRequest = () => ({
  yar: {
    flash: vi.fn()
  }
})

describe('Cookie Service', () => {
  let mockResponse
  let mockRequest

  beforeEach(() => {
    mockResponse = createMockResponse()
    mockRequest = createMockRequest()

    vi.spyOn(Date, 'now').mockReturnValue(1234567890000)
  })

  afterEach(() => {
    Date.now.mockRestore()
  })

  describe('createCookiePolicy', () => {
    test('should create cookie policy with analytics enabled', () => {
      const policy = createCookiePolicy(true)

      expect(policy).toEqual({
        essential: true,
        analytics: true,
        timestamp: 1234567890
      })
    })

    test('should create cookie policy with analytics disabled', () => {
      const policy = createCookiePolicy(false)

      expect(policy).toEqual({
        essential: true,
        analytics: false,
        timestamp: 1234567890
      })
    })

    test('should create timestamp in seconds (Unix timestamp)', () => {
      Date.now.mockReturnValue(1634567890123)
      const policy = createCookiePolicy(true)
      expect(policy.timestamp).toBe(1634567890)
    })
  })

  describe('setCookiePreferences', () => {
    beforeEach(() => {
      config.get.mockReturnValue(false)
    })

    test('should set cookies for analytics enabled in development environment', () => {
      config.get.mockReturnValue(false)

      setCookiePreferences(mockResponse, true)

      expect(mockResponse.state).toHaveBeenCalledTimes(2)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        {
          essential: true,
          analytics: true,
          timestamp: 1234567890
        },
        {
          encoding: COOKIE_OPTIONS_BASE64.ENCODING,
          ttl: COOKIE_OPTIONS_BASE64.TTL,
          path: COOKIE_OPTIONS_BASE64.PATH,
          isSecure: false,
          isSameSite: COOKIE_OPTIONS_BASE64.IS_SAME_SITE
        }
      )

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        'true',
        {
          ttl: COOKIE_OPTIONS.TTL,
          path: COOKIE_OPTIONS.PATH,
          isSecure: false,
          isSameSite: COOKIE_OPTIONS.IS_SAME_SITE
        }
      )
    })

    test('should set cookies for analytics disabled in development environment', () => {
      config.get.mockReturnValue(false)

      setCookiePreferences(mockResponse, false)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        {
          essential: true,
          analytics: false,
          timestamp: 1234567890
        },
        expect.objectContaining({
          isSecure: false
        })
      )

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        'true',
        expect.objectContaining({
          isSecure: false
        })
      )
    })

    test('should set secure cookies in production environment', () => {
      config.get.mockReturnValue(true)

      setCookiePreferences(mockResponse, true)

      expect(config.get).toHaveBeenCalledWith('isProduction')

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        expect.any(Object),
        expect.objectContaining({
          isSecure: true
        })
      )

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        'true',
        expect.objectContaining({
          isSecure: true
        })
      )
    })

    test('should use correct cookie options for policy cookie', () => {
      setCookiePreferences(mockResponse, true)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        expect.any(Object),
        {
          encoding: COOKIE_OPTIONS_BASE64.ENCODING,
          ttl: COOKIE_OPTIONS_BASE64.TTL,
          path: COOKIE_OPTIONS_BASE64.PATH,
          isSecure: false,
          isSameSite: COOKIE_OPTIONS_BASE64.IS_SAME_SITE
        }
      )
    })

    test('should use correct cookie options for preferences set cookie', () => {
      setCookiePreferences(mockResponse, false)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        'true',
        {
          ttl: COOKIE_OPTIONS.TTL,
          path: COOKIE_OPTIONS.PATH,
          isSecure: false,
          isSameSite: COOKIE_OPTIONS.IS_SAME_SITE
        }
      )
    })

    test('should handle truthy analytics values', () => {
      const truthyValues = [1, 'yes', 'true', [], {}]

      truthyValues.forEach((value) => {
        mockResponse.state.mockClear()

        setCookiePreferences(mockResponse, value)

        expect(mockResponse.state).toHaveBeenCalledWith(
          COOKIE_NAMES.POLICY,
          expect.objectContaining({
            analytics: value
          }),
          expect.any(Object)
        )
      })
    })

    test('should handle falsy analytics values', () => {
      const falsyValues = [0, '', null, undefined, NaN]

      falsyValues.forEach((value) => {
        mockResponse.state.mockClear()

        setCookiePreferences(mockResponse, value)

        expect(mockResponse.state).toHaveBeenCalledWith(
          COOKIE_NAMES.POLICY,
          expect.objectContaining({
            analytics: value
          }),
          expect.any(Object)
        )
      })
    })

    test('should handle config.get throwing an error', () => {
      config.get.mockImplementation(() => {
        throw new Error('Config error')
      })

      expect(() => {
        setCookiePreferences(mockResponse, true)
      }).toThrow('Config error')
    })

    test('should handle response.state throwing an error', () => {
      mockResponse.state.mockImplementation(() => {
        throw new Error('State setting error')
      })

      expect(() => {
        setCookiePreferences(mockResponse, true)
      }).toThrow('State setting error')
    })
  })

  describe('setConfirmationBanner', () => {
    test('should set flash message for confirmation banner', () => {
      setConfirmationBanner(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        FLASH_MESSAGE_KEYS.SHOW_CONFIRMATION_BANNER,
        true
      )
    })

    test('should call flash exactly once', () => {
      setConfirmationBanner(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledTimes(1)
    })

    test('should use correct flash message key', () => {
      setConfirmationBanner(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        FLASH_MESSAGE_KEYS.SHOW_CONFIRMATION_BANNER,
        expect.any(Boolean)
      )
    })

    test('should always set flash message to true', () => {
      setConfirmationBanner(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        expect.any(String),
        true
      )
    })
  })

  describe('integration scenarios', () => {
    test('should work together for complete cookie acceptance workflow', () => {
      const policy = createCookiePolicy(true)
      setCookiePreferences(mockResponse, true)
      setConfirmationBanner(mockRequest)

      expect(policy).toEqual({
        essential: true,
        analytics: true,
        timestamp: 1234567890
      })

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        policy,
        expect.any(Object)
      )

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        FLASH_MESSAGE_KEYS.SHOW_CONFIRMATION_BANNER,
        true
      )
    })

    test('should work together for complete cookie rejection workflow', () => {
      const policy = createCookiePolicy(false)
      setCookiePreferences(mockResponse, false)
      setConfirmationBanner(mockRequest)

      expect(policy).toEqual({
        essential: true,
        analytics: false,
        timestamp: 1234567890
      })

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        policy,
        expect.any(Object)
      )

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        FLASH_MESSAGE_KEYS.SHOW_CONFIRMATION_BANNER,
        true
      )
    })

    test('should handle production environment workflow', () => {
      config.get.mockReturnValue(true)

      const policy = createCookiePolicy(true)
      setCookiePreferences(mockResponse, true)
      setConfirmationBanner(mockRequest)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        policy,
        expect.objectContaining({
          isSecure: true
        })
      )

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        'true',
        expect.objectContaining({
          isSecure: true
        })
      )
    })
  })

  describe('cookie options validation', () => {
    test('should use base64json encoding for policy cookie', () => {
      setCookiePreferences(mockResponse, true)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        expect.any(Object),
        expect.objectContaining({
          encoding: 'base64json'
        })
      )
    })

    test('should use Lax SameSite policy', () => {
      setCookiePreferences(mockResponse, true)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        expect.any(Object),
        expect.objectContaining({
          isSameSite: 'Lax'
        })
      )

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        'true',
        expect.objectContaining({
          isSameSite: 'Lax'
        })
      )
    })

    test('should set path to root for site-wide access', () => {
      setCookiePreferences(mockResponse, true)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        expect.any(Object),
        expect.objectContaining({
          path: '/'
        })
      )

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        'true',
        expect.objectContaining({
          path: '/'
        })
      )
    })

    test('should set appropriate TTL values', () => {
      setCookiePreferences(mockResponse, true)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        expect.any(Object),
        expect.objectContaining({
          ttl: COOKIE_OPTIONS_BASE64.TTL
        })
      )

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        'true',
        expect.objectContaining({
          ttl: COOKIE_OPTIONS.TTL
        })
      )
    })
  })
})
