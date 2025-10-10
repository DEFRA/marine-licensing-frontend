import { vi } from 'vitest'
import joi from 'joi'
import { cookiesController, cookiesSubmitController } from './controller.js'
import * as cookiePreferences from '#src/server/common/helpers/cookie-preferences.js'
import * as referrerValidation from '#src/server/common/helpers/referrer-validation.js'
import * as cookieService from '#src/server/common/helpers/cookie-service.js'
import { config } from '#src/config/config.js'

vi.mock('~/src/server/common/helpers/cookie-preferences.js')
vi.mock('~/src/server/common/helpers/referrer-validation.js')
vi.mock('~/src/server/common/helpers/cookie-service.js')
vi.mock('~/src/config/config.js')

const createMockRequest = (overrides = {}) => ({
  headers: {},
  auth: { isAuthenticated: false },
  query: {},
  payload: {},
  logger: { error: vi.fn() },
  state: {},
  yar: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
  ...overrides
})

const createMockH = () => ({
  view: vi.fn(),
  redirect: vi.fn().mockReturnValue({ state: vi.fn().mockReturnThis() })
})

const DEFAULT_PREFERENCES = {
  essential: true,
  analytics: false,
  timestamp: null
}

const setupMocks = (preferences = DEFAULT_PREFERENCES) => {
  cookiePreferences.getCookiePreferences.mockReturnValue(preferences)
  referrerValidation.storeReferrer.mockReturnValue(undefined)
  referrerValidation.getBackUrl.mockReturnValue('/')
  referrerValidation.clearStoredReferrer.mockReturnValue(undefined)
  referrerValidation.getValidatedReferrerPath.mockReturnValue(
    '/exemption/task-list'
  )
  cookieService.setCookiePreferences.mockImplementation(
    (response, analytics) => {
      // Mock the actual behavior of setCookiePreferences
      const isSecure = config.get('isProduction')
      response.state(
        'cookies_policy',
        {
          essential: true,
          analytics,
          timestamp: Math.floor(Date.now() / 1000)
        },
        {
          encoding: 'base64json',
          ttl: 31536000000,
          path: '/',
          isSecure,
          isSameSite: 'Strict'
        }
      )
      response.state('cookies_preferences_set', 'true', {
        ttl: 31536000000,
        path: '/',
        isSecure,
        isSameSite: 'Strict'
      })
    }
  )
  cookieService.setConfirmationBanner.mockReturnValue(undefined)
  config.get.mockReturnValue(false)
}

describe('Cookies Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = createMockRequest()
    mockH = createMockH()
  })

  describe('cookiesController (GET)', () => {
    beforeEach(() => setupMocks())

    it('should render cookies page with default preferences', () => {
      cookiesController.handler(mockRequest, mockH)

      expect(cookiePreferences.getCookiePreferences).toHaveBeenCalledWith(
        mockRequest
      )
      expect(mockH.view).toHaveBeenCalledWith('help/cookies/index', {
        pageTitle: 'Cookies on Get permission for marine work',
        backUrl: '/',
        payload: { analytics: 'no' },
        showSuccessBanner: false,
        isAuthenticated: false
      })
    })

    it('should set analytics to "yes" when analytics enabled', () => {
      setupMocks({ essential: true, analytics: true, timestamp: 1234567890 })

      cookiesController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'help/cookies/index',
        expect.objectContaining({
          payload: { analytics: 'yes' }
        })
      )
    })

    it('should pass through authenticated status when user is logged in', () => {
      mockRequest.auth.isAuthenticated = true

      cookiesController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isAuthenticated: true
        })
      )
    })

    it('should store referrer when provided', () => {
      mockRequest.headers.referer = 'http://localhost/exemption/task-list'
      referrerValidation.getBackUrl.mockReturnValue('/exemption/task-list')

      cookiesController.handler(mockRequest, mockH)

      expect(referrerValidation.storeReferrer).toHaveBeenCalledWith(
        mockRequest,
        'http://localhost/exemption/task-list',
        ['/help/cookies']
      )
      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          backUrl: '/exemption/task-list'
        })
      )
    })

    it('should not store referrer when from cookies page itself', () => {
      mockRequest.headers.referer = 'http://localhost/help/cookies'
      referrerValidation.getBackUrl.mockReturnValue('/')

      cookiesController.handler(mockRequest, mockH)

      expect(referrerValidation.storeReferrer).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          backUrl: '/'
        })
      )
    })

    it('should not store referrer when no referer header', () => {
      referrerValidation.getBackUrl.mockReturnValue('/')

      cookiesController.handler(mockRequest, mockH)

      expect(referrerValidation.storeReferrer).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          backUrl: '/'
        })
      )
    })

    it('should show success banner when query is true', () => {
      mockRequest.query.success = 'true'

      cookiesController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showSuccessBanner: true
        })
      )
      expect(referrerValidation.clearStoredReferrer).toHaveBeenCalledWith(
        mockRequest
      )
    })

    it('should not show success banner when query is false', () => {
      mockRequest.query.success = 'false'

      cookiesController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showSuccessBanner: false
        })
      )
      expect(referrerValidation.clearStoredReferrer).not.toHaveBeenCalled()
    })

    it('should not show success banner when query is undefined', () => {
      cookiesController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showSuccessBanner: false
        })
      )
      expect(referrerValidation.clearStoredReferrer).not.toHaveBeenCalled()
    })

    it('should pass excluded paths to getBackUrl', () => {
      cookiesController.handler(mockRequest, mockH)

      expect(referrerValidation.getBackUrl).toHaveBeenCalledWith(
        mockRequest,
        '/',
        ['/help/cookies']
      )
    })

    it('should have correct auth strategy configuration', () => {
      expect(cookiesController.options.auth).toBe(false)
    })
  })

  describe('cookiesSubmitController (POST)', () => {
    let mockResponse

    beforeEach(() => {
      setupMocks() // Ensure all referrer validation functions are mocked
      mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      vi.spyOn(Date, 'now').mockReturnValue(1234567890000)
    })

    afterEach(() => {
      Date.now.mockRestore()
    })

    describe('successful submissions', () => {
      it('should accept analytics cookies and redirect with success', () => {
        mockRequest.payload = { analytics: 'yes' }

        const result = cookiesSubmitController.handler(mockRequest, mockH)

        expect(mockH.redirect).toHaveBeenCalledWith(
          '/help/cookies?success=true'
        )
        expect(mockResponse.state).toHaveBeenCalledWith(
          'cookies_policy',
          {
            essential: true,
            analytics: true,
            timestamp: 1234567890
          },
          {
            ttl: 365 * 24 * 60 * 60 * 1000,
            path: '/',
            isSecure: false,
            isSameSite: 'Strict',
            encoding: 'base64json'
          }
        )
        expect(mockResponse.state).toHaveBeenCalledWith(
          'cookies_preferences_set',
          'true',
          {
            ttl: 365 * 24 * 60 * 60 * 1000,
            path: '/',
            isSecure: false,
            isSameSite: 'Strict'
          }
        )
        expect(result).toBe(mockResponse)
      })

      it('should reject analytics cookies and redirect with success', () => {
        mockRequest.payload = { analytics: 'no' }

        const result = cookiesSubmitController.handler(mockRequest, mockH)

        expect(mockH.redirect).toHaveBeenCalledWith(
          '/help/cookies?success=true'
        )
        expect(mockResponse.state).toHaveBeenCalledWith(
          'cookies_policy',
          {
            essential: true,
            analytics: false,
            timestamp: 1234567890
          },
          expect.objectContaining({
            encoding: 'base64json'
          })
        )
        expect(result).toBe(mockResponse)
      })

      it('should set secure cookies in production environment', () => {
        config.get.mockReturnValue(true)
        mockRequest.payload = { analytics: 'yes' }

        cookiesSubmitController.handler(mockRequest, mockH)

        expect(config.get).toHaveBeenCalledWith('isProduction')
        expect(mockResponse.state).toHaveBeenCalledWith(
          'cookies_policy',
          expect.any(Object),
          expect.objectContaining({
            isSecure: true
          })
        )
        expect(mockResponse.state).toHaveBeenCalledWith(
          'cookies_preferences_set',
          'true',
          expect.objectContaining({
            isSecure: true
          })
        )
      })
    })

    describe('referer validation security', () => {
      beforeEach(() => {
        mockRequest.payload = { analytics: 'yes', source: 'banner' }
      })

      it('should redirect to valid referer when available', () => {
        mockRequest.headers.referer = 'http://localhost/exemption/task-list'
        referrerValidation.getValidatedReferrerPath.mockReturnValue(
          '/exemption/task-list'
        )

        cookiesSubmitController.handler(mockRequest, mockH)

        expect(
          referrerValidation.getValidatedReferrerPath
        ).toHaveBeenCalledWith('http://localhost/exemption/task-list', [
          '/help/cookies'
        ])
        expect(mockH.redirect).toHaveBeenCalledWith('/exemption/task-list')
      })

      it('should redirect to homepage when referer is invalid', () => {
        mockRequest.headers.referer = 'javascript:alert("xss")'
        referrerValidation.getValidatedReferrerPath.mockReturnValue(null)

        cookiesSubmitController.handler(mockRequest, mockH)

        expect(
          referrerValidation.getValidatedReferrerPath
        ).toHaveBeenCalledWith('javascript:alert("xss")', ['/help/cookies'])
        expect(mockH.redirect).toHaveBeenCalledWith('/')
      })

      it('should redirect to homepage when referer path is excluded', () => {
        mockRequest.headers.referer = 'http://localhost/help/cookies'
        referrerValidation.getValidatedReferrerPath.mockReturnValue(null)

        cookiesSubmitController.handler(mockRequest, mockH)

        expect(
          referrerValidation.getValidatedReferrerPath
        ).toHaveBeenCalledWith('http://localhost/help/cookies', [
          '/help/cookies'
        ])
        expect(mockH.redirect).toHaveBeenCalledWith('/')
      })

      it('should redirect to homepage when no referer header present', () => {
        mockRequest.headers.referer = undefined
        referrerValidation.getValidatedReferrerPath.mockReturnValue(null)

        cookiesSubmitController.handler(mockRequest, mockH)

        expect(
          referrerValidation.getValidatedReferrerPath
        ).toHaveBeenCalledWith(undefined, ['/help/cookies'])
        expect(mockH.redirect).toHaveBeenCalledWith('/')
      })

      it('should redirect to homepage when getValidatedReferrerPath returns null', () => {
        mockRequest.headers.referer = 'invalid-url'
        referrerValidation.getValidatedReferrerPath.mockReturnValue(null)

        cookiesSubmitController.handler(mockRequest, mockH)

        expect(
          referrerValidation.getValidatedReferrerPath
        ).toHaveBeenCalledWith('invalid-url', ['/help/cookies'])
        expect(mockH.redirect).toHaveBeenCalledWith('/')
      })

      it('should not validate referer when not from banner (page submission)', () => {
        mockRequest.payload.source = 'page'
        mockRequest.headers.referer = 'http://localhost/exemption/task-list'

        cookiesSubmitController.handler(mockRequest, mockH)

        expect(
          referrerValidation.getValidatedReferrerPath
        ).not.toHaveBeenCalled()
        expect(mockH.redirect).toHaveBeenCalledWith(
          '/help/cookies?success=true'
        )
      })
    })

    describe('error handling', () => {
      it('should throw internal server error when cookie setting fails', () => {
        mockRequest.payload = { analytics: 'yes' }
        mockH.redirect.mockImplementation(() => {
          throw new Error('Cookie setting failed')
        })

        expect(() => {
          cookiesSubmitController.handler(mockRequest, mockH)
        }).toThrow('Error saving cookie preferences')

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          expect.any(Error),
          'Error saving cookie preferences'
        )
      })

      it('should handle Date.now errors gracefully', () => {
        Date.now.mockImplementation(() => {
          throw new Error('Date error')
        })
        mockRequest.payload = { analytics: 'yes' }

        expect(() => {
          cookiesSubmitController.handler(mockRequest, mockH)
        }).toThrow('Error saving cookie preferences')
      })
    })

    describe('controller options', () => {
      it('should have correct auth configuration', () => {
        expect(cookiesSubmitController.options.auth).toBe(false)
      })

      it('should not have crumb protection disabled', () => {
        expect(cookiesSubmitController.options.plugins).toBeUndefined()
      })

      it('should have correct validation schema', () => {
        const schema = cookiesSubmitController.options.validate.payload
        expect(joi.isSchema(schema)).toBe(true)

        expect(
          schema.validate({ csrfToken: 'token123', analytics: 'yes' }).error
        ).toBeUndefined()
        expect(
          schema.validate({ csrfToken: 'token123', analytics: 'no' }).error
        ).toBeUndefined()

        expect(schema.validate({ analytics: 'yes' }).error).toBeUndefined()
        expect(schema.validate({ analytics: 'no' }).error).toBeUndefined()

        expect(schema.validate({ analytics: 'maybe' }).error).toBeDefined()
        expect(schema.validate({ analytics: '' }).error).toBeDefined()
        expect(schema.validate({}).error).toBeDefined()
      })
    })

    describe('validation failAction', () => {
      let mockErr

      beforeEach(() => {
        mockErr = {
          details: [
            {
              context: { key: 'analytics' },
              path: ['analytics'],
              type: 'any.required',
              message: 'ANALYTICS_CHOICE_REQUIRED'
            }
          ]
        }
        referrerValidation.getBackUrl.mockReturnValue('/test-back-url')
      })

      it('should pass excluded paths to getBackUrl in failAction', () => {
        mockRequest.payload = { analytics: '' }
        const mockTakeoverResponse = { takeover: vi.fn().mockReturnThis() }
        mockH.view.mockReturnValue(mockTakeoverResponse)

        cookiesSubmitController.options.validate.failAction(
          mockRequest,
          mockH,
          mockErr
        )

        expect(referrerValidation.getBackUrl).toHaveBeenCalledWith(
          mockRequest,
          '/',
          ['/help/cookies']
        )
      })

      it('should handle validation errors with error details', () => {
        mockRequest.payload = { analytics: '' }
        const mockTakeoverResponse = { takeover: vi.fn().mockReturnThis() }
        mockH.view.mockReturnValue(mockTakeoverResponse)

        const result = cookiesSubmitController.options.validate.failAction(
          mockRequest,
          mockH,
          mockErr
        )

        expect(mockH.view).toHaveBeenCalledWith(
          'help/cookies/index',
          expect.objectContaining({
            pageTitle: 'Cookies on Get permission for marine work',
            backUrl: '/test-back-url',
            payload: { analytics: '' },
            errorSummary: expect.arrayContaining([
              expect.objectContaining({
                text: 'Select yes if you want to accept analytics cookies'
              })
            ]),
            errors: expect.objectContaining({
              analytics: expect.objectContaining({
                text: 'Select yes if you want to accept analytics cookies'
              })
            }),
            isAuthenticated: false
          })
        )
        expect(mockTakeoverResponse.takeover).toHaveBeenCalled()
        expect(result).toBe(mockTakeoverResponse)
      })

      it('should handle validation errors without error details', () => {
        mockRequest.payload = { analytics: 'invalid' }
        mockErr.details = undefined
        const mockTakeoverResponse = { takeover: vi.fn().mockReturnThis() }
        mockH.view.mockReturnValue(mockTakeoverResponse)

        const result = cookiesSubmitController.options.validate.failAction(
          mockRequest,
          mockH,
          mockErr
        )

        expect(mockH.view).toHaveBeenCalledWith(
          'help/cookies/index',
          expect.objectContaining({
            payload: { analytics: 'invalid' },
            isAuthenticated: false
          })
        )
        expect(mockTakeoverResponse.takeover).toHaveBeenCalled()
        expect(result).toBe(mockTakeoverResponse)
      })

      it('should use authenticated status in error response', () => {
        mockRequest.auth.isAuthenticated = true
        mockRequest.payload = { analytics: '' }
        const mockTakeoverResponse = { takeover: vi.fn().mockReturnThis() }
        mockH.view.mockReturnValue(mockTakeoverResponse)

        cookiesSubmitController.options.validate.failAction(
          mockRequest,
          mockH,
          mockErr
        )

        expect(mockH.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            isAuthenticated: true
          })
        )
      })
    })
  })

  describe('cookie options configuration', () => {
    let mockResponse

    beforeEach(() => {
      setupMocks()
      mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)
    })

    it('should set correct TTL (1 year in milliseconds)', () => {
      mockRequest.payload = { analytics: 'yes' }
      const expectedTtl = 365 * 24 * 60 * 60 * 1000

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(mockResponse.state).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          ttl: expectedTtl
        })
      )
    })

    it('should set SameSite to Strict for security', () => {
      mockRequest.payload = { analytics: 'no' }

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(mockResponse.state).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          isSameSite: 'Strict'
        })
      )
    })

    it('should set path to root for site-wide access', () => {
      mockRequest.payload = { analytics: 'yes' }

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(mockResponse.state).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          path: '/'
        })
      )
    })
  })

  describe('timestamp generation', () => {
    let mockResponse

    beforeEach(() => {
      setupMocks()
      mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)
    })

    it('should generate timestamp in seconds (Unix timestamp)', () => {
      mockRequest.payload = { analytics: 'yes' }
      vi.spyOn(Date, 'now').mockReturnValue(1234567890123)

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(mockResponse.state).toHaveBeenCalledWith(
        'cookies_policy',
        expect.objectContaining({
          timestamp: 1234567890
        }),
        expect.any(Object)
      )

      Date.now.mockRestore()
    })
  })
})
