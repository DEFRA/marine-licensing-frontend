import joi from 'joi'
import { cookiesController, cookiesSubmitController } from './controller.js'
import * as cookiePreferences from '~/src/server/common/helpers/cookie-preferences.js'
import * as referrerValidation from '~/src/server/common/helpers/referrer-validation.js'

jest.mock('~/src/server/common/helpers/cookie-preferences.js')
jest.mock('~/src/server/common/helpers/referrer-validation.js')

const createMockRequest = (overrides = {}) => ({
  headers: {},
  auth: { isAuthenticated: false },
  query: {},
  payload: {},
  logger: { error: jest.fn() },
  state: {},
  yar: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
  ...overrides
})

const createMockH = () => ({
  view: jest.fn(),
  redirect: jest.fn().mockReturnValue({ state: jest.fn().mockReturnThis() })
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
}

describe('Cookies Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = createMockRequest()
    mockH = createMockH()
    jest.clearAllMocks()
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
      mockResponse = {
        state: jest.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      jest.spyOn(Date, 'now').mockReturnValue(1234567890000)
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
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'
        mockRequest.payload = { analytics: 'yes' }

        cookiesSubmitController.handler(mockRequest, mockH)

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

        process.env.NODE_ENV = originalEnv
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
        const mockTakeoverResponse = { takeover: jest.fn().mockReturnThis() }
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
        const mockTakeoverResponse = { takeover: jest.fn().mockReturnThis() }
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
        const mockTakeoverResponse = { takeover: jest.fn().mockReturnThis() }
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
        const mockTakeoverResponse = { takeover: jest.fn().mockReturnThis() }
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
    it('should set correct TTL (1 year in milliseconds)', () => {
      mockRequest.payload = { analytics: 'yes' }
      const expectedTtl = 365 * 24 * 60 * 60 * 1000

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(mockH.redirect().state).toHaveBeenCalledWith(
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

      expect(mockH.redirect().state).toHaveBeenCalledWith(
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

      expect(mockH.redirect().state).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          path: '/'
        })
      )
    })
  })

  describe('timestamp generation', () => {
    it('should generate timestamp in seconds (Unix timestamp)', () => {
      mockRequest.payload = { analytics: 'yes' }
      jest.spyOn(Date, 'now').mockReturnValue(1234567890123)

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(mockH.redirect().state).toHaveBeenCalledWith(
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
