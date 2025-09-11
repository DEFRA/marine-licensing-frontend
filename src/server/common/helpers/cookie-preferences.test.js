import {
  getCookiePreferences,
  areAnalyticsCookiesAccepted
} from './cookie-preferences.js'

const DEFAULT_PREFERENCES = {
  essential: true,
  analytics: false,
  timestamp: null
}

const createMockRequest = (state) => ({ state })
const createMockRequestWithPolicy = (cookiesPolicy) =>
  createMockRequest({ cookies_policy: cookiesPolicy })

describe('cookie-preferences', () => {
  describe('getCookiePreferences', () => {
    describe('when cookies_policy exists', () => {
      const validPolicyTestCases = [
        {
          name: 'analytics enabled with timestamp',
          policy: { essential: true, analytics: true, timestamp: 1234567890 }
        },
        {
          name: 'analytics disabled with timestamp',
          policy: { essential: true, analytics: false, timestamp: 1234567890 }
        },
        {
          name: 'null timestamp',
          policy: { essential: true, analytics: true, timestamp: null }
        },
        {
          name: 'extra properties preserved',
          policy: {
            essential: true,
            analytics: false,
            timestamp: 9876543210,
            extraProperty: 'should be preserved'
          }
        }
      ]

      validPolicyTestCases.forEach(({ name, policy }) => {
        it(`should return existing policy when ${name}`, () => {
          const result = getCookiePreferences(
            createMockRequestWithPolicy(policy)
          )
          expect(result).toEqual(policy)
        })
      })
    })

    describe('when cookies_policy does not exist', () => {
      const noPolicyTestCases = [
        { name: 'state is undefined', request: { state: undefined } },
        { name: 'state is null', request: { state: null } },
        { name: 'state is empty object', request: { state: {} } },
        {
          name: 'cookies_policy is undefined',
          request: { state: { cookies_policy: undefined } }
        },
        {
          name: 'cookies_policy is null',
          request: { state: { cookies_policy: null } }
        }
      ]

      noPolicyTestCases.forEach(({ name, request }) => {
        it(`should return default preferences when ${name}`, () => {
          expect(getCookiePreferences(request)).toEqual(DEFAULT_PREFERENCES)
        })
      })
    })

    describe('edge cases', () => {
      it('should handle request with no state property', () => {
        expect(getCookiePreferences({})).toEqual(DEFAULT_PREFERENCES)
      })

      it('should return default preferences for falsy cookies_policy values', () => {
        const falsyValues = [false, 0, '', NaN]

        falsyValues.forEach((value) => {
          expect(
            getCookiePreferences(createMockRequestWithPolicy(value))
          ).toEqual(DEFAULT_PREFERENCES)
        })
      })

      it('should preserve unexpected data types in cookies_policy', () => {
        const unexpectedValue = 'unexpected string'
        expect(
          getCookiePreferences(createMockRequestWithPolicy(unexpectedValue))
        ).toBe(unexpectedValue)
      })
    })
  })

  describe('areAnalyticsCookiesAccepted', () => {
    it('should return true when analytics is explicitly true', () => {
      const request = createMockRequestWithPolicy({
        essential: true,
        analytics: true,
        timestamp: 1234567890
      })
      expect(areAnalyticsCookiesAccepted(request)).toBe(true)
    })

    const analyticsRejectedTestCases = [
      {
        name: 'analytics is explicitly false',
        request: createMockRequestWithPolicy({ analytics: false })
      },
      { name: 'using default preferences', request: createMockRequest({}) },
      { name: 'state is undefined', request: createMockRequest(undefined) },
      {
        name: 'cookies_policy is null',
        request: createMockRequestWithPolicy(null)
      },
      {
        name: 'analytics property missing',
        request: createMockRequestWithPolicy({
          essential: true,
          timestamp: 1234567890
        })
      },
      {
        name: 'analytics is undefined',
        request: createMockRequestWithPolicy({ analytics: undefined })
      },
      { name: 'no state property', request: {} }
    ]

    analyticsRejectedTestCases.forEach(({ name, request }) => {
      it(`should return false when ${name}`, () => {
        expect(areAnalyticsCookiesAccepted(request)).toBe(false)
      })
    })

    it('should return false for truthy but non-true analytics values', () => {
      const truthyButNotTrue = [1, 'true', 'yes', [], {}]

      truthyButNotTrue.forEach((value) => {
        const request = createMockRequestWithPolicy({
          analytics: value,
          essential: true,
          timestamp: 1234567890
        })
        expect(areAnalyticsCookiesAccepted(request)).toBe(false)
      })
    })
  })

  describe('integration scenarios', () => {
    describe('complete user workflow', () => {
      it('should handle fresh user with no cookies', () => {
        const mockRequest = { state: {} }

        expect(areAnalyticsCookiesAccepted(mockRequest)).toBe(false)
        expect(getCookiePreferences(mockRequest)).toEqual({
          essential: true,
          analytics: false,
          timestamp: null
        })
      })

      it('should handle user who accepted analytics cookies', () => {
        const mockRequest = {
          state: {
            cookies_policy: {
              essential: true,
              analytics: true,
              timestamp: 1234567890
            },
            cookies_preferences_set: 'true'
          }
        }

        expect(areAnalyticsCookiesAccepted(mockRequest)).toBe(true)
        expect(getCookiePreferences(mockRequest)).toEqual({
          essential: true,
          analytics: true,
          timestamp: 1234567890
        })
      })

      it('should handle user who rejected analytics cookies', () => {
        const mockRequest = {
          state: {
            cookies_policy: {
              essential: true,
              analytics: false,
              timestamp: 1234567890
            },
            cookies_preferences_set: 'true'
          }
        }

        expect(areAnalyticsCookiesAccepted(mockRequest)).toBe(false)
        expect(getCookiePreferences(mockRequest)).toEqual({
          essential: true,
          analytics: false,
          timestamp: 1234567890
        })
      })
    })

    describe('data consistency scenarios', () => {
      it('should handle inconsistent state where preferences_set exists but policy does not', () => {
        const mockRequest = {
          state: {
            cookies_preferences_set: 'true'
          }
        }

        expect(areAnalyticsCookiesAccepted(mockRequest)).toBe(false)
        expect(getCookiePreferences(mockRequest)).toEqual({
          essential: true,
          analytics: false,
          timestamp: null
        })
      })

      it('should handle inconsistent state where policy exists but preferences_set does not', () => {
        const mockRequest = {
          state: {
            cookies_policy: {
              essential: true,
              analytics: true,
              timestamp: 1234567890
            }
          }
        }

        expect(areAnalyticsCookiesAccepted(mockRequest)).toBe(true)
        expect(getCookiePreferences(mockRequest)).toEqual({
          essential: true,
          analytics: true,
          timestamp: 1234567890
        })
      })
    })
  })
})
