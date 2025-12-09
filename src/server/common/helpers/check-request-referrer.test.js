import { describe, test, expect, beforeEach, vi } from 'vitest'
import { isUserReferredFromDefraAccount } from './check-request-referrer.js'
import { createMockRequest } from '#src/server/test-helpers/mocks.js'
import { config } from '#src/config/config.js'

const DEFRA_ACCOUNT_URL =
  'https://your-account.cpdev.cui.defra.gov.uk/management'

vi.mock('#src/config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

describe('check-request-referrer', () => {
  describe('isUserReferredFromDefraAccount', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = createMockRequest()
      config.get.mockReturnValue({
        accountManagementUrl: DEFRA_ACCOUNT_URL
      })
    })

    test('should return true when referer matches account management URL', () => {
      mockRequest.headers.referer = DEFRA_ACCOUNT_URL

      const result = isUserReferredFromDefraAccount(mockRequest)

      expect(result).toBe(true)
    })

    test('should return true when the referer includes the account management URL', () => {
      mockRequest.headers.referer =
        'https://your-account.cpdev.cui.defra.gov.uk/management/account-management/me'

      const result = isUserReferredFromDefraAccount(mockRequest)

      expect(result).toBe(true)
    })

    test('should return false when referer does not match', () => {
      mockRequest.headers.referer = 'https://some-other-site.com'

      const result = isUserReferredFromDefraAccount(mockRequest)

      expect(result).toBe(false)
    })

    test('should return false when referer is undefined', () => {
      mockRequest.headers.referer = undefined

      const result = isUserReferredFromDefraAccount(mockRequest)

      expect(result).toBeFalsy()
    })

    test('should return false when referer is null', () => {
      mockRequest.headers.referer = null

      const result = isUserReferredFromDefraAccount(mockRequest)

      expect(result).toBeFalsy()
    })

    test('should return false when referer is empty string', () => {
      mockRequest.headers.referer = ''

      const result = isUserReferredFromDefraAccount(mockRequest)

      expect(result).toBeFalsy()
    })

    test('should handle when accountManagementUrl is undefined', () => {
      config.get.mockReturnValueOnce({ accountManagementUrl: undefined })

      mockRequest.headers.referer = 'https://some-site.com'

      const result = isUserReferredFromDefraAccount(mockRequest)

      expect(result).toBeFalsy()
    })

    test('should handle when accountManagementUrl is null', () => {
      config.get.mockReturnValueOnce({ accountManagementUrl: null })

      mockRequest.headers.referer = 'https://some-site.com'

      const result = isUserReferredFromDefraAccount(mockRequest)

      expect(result).toBeFalsy()
    })
  })
})
