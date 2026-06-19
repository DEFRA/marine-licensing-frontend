import { vi } from 'vitest'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  clearReturnToCache,
  setReturnToCache
} from '#src/server/common/helpers/marine-licence/session-cache/return-to-cache.js'

describe('return-to-cache', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockH = {}
    mockRequest = {
      yar: {
        clear: vi.fn(),
        flash: vi.fn(),
        set: vi.fn(),
        commit: vi.fn()
      }
    }
  })

  describe('setReturnToCache', () => {
    test('clears, sets flash and session values, then commits', async () => {
      await setReturnToCache(
        mockRequest,
        mockH,
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )

      expect(mockRequest.yar.clear).toHaveBeenCalledWith(RETURN_TO_CACHE_KEY)
      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        RETURN_TO_CACHE_KEY,
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
        true
      )
      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        RETURN_TO_CACHE_KEY,
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })
  })

  describe('clearReturnToCache', () => {
    test('clears both flash and session values', () => {
      clearReturnToCache(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(RETURN_TO_CACHE_KEY)
      expect(mockRequest.yar.clear).toHaveBeenCalledWith(RETURN_TO_CACHE_KEY)
    })
  })
})
