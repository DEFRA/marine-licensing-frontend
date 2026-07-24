import { vi } from 'vitest'
import {
  storeMarinePlanPolicyQueryStartTime,
  getMarinePlanPolicyQueryStartTime,
  triggerMarinePlanPolicyQuery
} from './marine-plan-policy-query.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

const createMockRequest = () => ({
  yar: {
    get: vi.fn(),
    set: vi.fn()
  }
})

describe('marine-plan-policy-query', () => {
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

  describe('triggerMarinePlanPolicyQuery', () => {
    it('posts the calculate request and stores the start time', async () => {
      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      vi.mocked(authenticatedPostRequest).mockResolvedValue({})

      await triggerMarinePlanPolicyQuery(mockRequest, 'test-id')

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        mockRequest,
        apiRoutes.CALCULATE_MARINE_PLAN_POLICIES,
        JSON.stringify({ id: 'test-id' })
      )
      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'marinePlanPolicyQueryStartedAt',
        now
      )
    })
  })
})
