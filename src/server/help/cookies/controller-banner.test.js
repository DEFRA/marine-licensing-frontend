import { vi } from 'vitest'
import { cookiesSubmitController } from './controller.js'
import * as cookieService from '~/src/server/common/helpers/cookie-service.js'

vi.mock('~/src/server/common/helpers/cookie-service.js')

const createMockRequest = (overrides = {}) => ({
  headers: {},
  payload: {},
  logger: { error: vi.fn() },
  ...overrides
})

const createMockH = () => ({
  redirect: vi.fn().mockReturnValue({
    state: vi.fn().mockReturnThis()
  })
})

describe('Cookie Controller Error Handling', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = createMockRequest()
    mockH = createMockH()

    cookieService.setCookiePreferences.mockImplementation(() => undefined)
    cookieService.setConfirmationBanner.mockImplementation(() => undefined)
  })

  describe('error handling', () => {
    test('should handle cookie service errors and log them', () => {
      mockRequest.payload = { analytics: 'yes', source: 'banner' }
      const mockError = new Error('Cookie service failed')
      cookieService.setCookiePreferences.mockImplementation(() => {
        throw mockError
      })

      expect(() => {
        cookiesSubmitController.handler(mockRequest, mockH)
      }).toThrow('Error saving cookie preferences')

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        mockError,
        'Error saving cookie preferences'
      )
    })

    test('should handle confirmation banner errors and log them', () => {
      mockRequest.payload = { analytics: 'yes', source: 'banner' }
      const mockError = new Error('Flash message failed')
      cookieService.setConfirmationBanner.mockImplementation(() => {
        throw mockError
      })

      expect(() => {
        cookiesSubmitController.handler(mockRequest, mockH)
      }).toThrow('Error saving cookie preferences')

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        mockError,
        'Error saving cookie preferences'
      )
    })

    test('should handle redirect errors and log them', () => {
      mockRequest.payload = { analytics: 'yes', source: 'banner' }
      const mockError = new Error('Redirect failed')
      mockH.redirect.mockImplementation(() => {
        throw mockError
      })

      expect(() => {
        cookiesSubmitController.handler(mockRequest, mockH)
      }).toThrow('Error saving cookie preferences')

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        mockError,
        'Error saving cookie preferences'
      )
    })

    test('should catch and wrap any unexpected errors', () => {
      mockRequest.payload = { analytics: 'yes', source: 'banner' }
      mockH.redirect.mockImplementation(() => {
        throw new TypeError('Unexpected error')
      })

      expect(() => {
        cookiesSubmitController.handler(mockRequest, mockH)
      }).toThrow('Error saving cookie preferences')
    })
  })
})
