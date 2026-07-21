import { vi } from 'vitest'
import {
  storeMarinePlanPolicyQueryStartTime,
  getMarinePlanPolicyQueryStartTime
} from './marine-plan-policy-wait.js'

const createMockRequest = () => ({
  yar: {
    get: vi.fn(),
    set: vi.fn()
  }
})

describe('marine-plan-policy-wait', () => {
  let mockRequest

  beforeEach(() => {
    mockRequest = createMockRequest()
  })

  describe('storeMarinePlanPolicyQueryStartTime', () => {
    it('stores the current timestamp under the expected key', () => {
      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)

      storeMarinePlanPolicyQueryStartTime(mockRequest)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'marinePlanPolicyQueryStartedAt',
        now
      )
    })
  })

  describe('getMarinePlanPolicyQueryStartTime', () => {
    it('returns the stored timestamp', () => {
      mockRequest.yar.get.mockReturnValue(1700000000000)

      expect(getMarinePlanPolicyQueryStartTime(mockRequest)).toBe(1700000000000)
      expect(mockRequest.yar.get).toHaveBeenCalledWith(
        'marinePlanPolicyQueryStartedAt'
      )
    })

    it('returns undefined when nothing is stored', () => {
      mockRequest.yar.get.mockReturnValue(undefined)

      expect(getMarinePlanPolicyQueryStartTime(mockRequest)).toBeUndefined()
    })
  })
})
