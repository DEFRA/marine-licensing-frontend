import { vi } from 'vitest'
import { clone } from '@hapi/hoek'
import {
  MARINE_LICENSE_CACHE_KEY,
  getMarineLicenseCache,
  setMarineLicenseCache
} from '#src/server/common/helpers/marine-license/session-cache/utils.js'

vi.mock('@hapi/hoek', () => ({
  clone: vi.fn((data) => ({ ...data }))
}))

describe('#utils', () => {
  describe('getMarineLicenseCache', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = {
        yar: {
          get: vi.fn(),
          commit: vi.fn()
        }
      }
    })

    test('should return an empty object when no cache is set', () => {
      mockRequest.yar.get.mockReturnValue(undefined)

      const result = getMarineLicenseCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(MARINE_LICENSE_CACHE_KEY)
      expect(clone).toHaveBeenCalledWith({})
      expect(result).toEqual({})
    })

    test('should return a copy of cached data when it is previously set', () => {
      const cachedData = { projectName: 'Test project', id: '123' }
      mockRequest.yar.get.mockReturnValue(cachedData)

      const result = getMarineLicenseCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(MARINE_LICENSE_CACHE_KEY)
      expect(clone).toHaveBeenCalledWith(cachedData)
      expect(result).not.toBe(cachedData)
      expect(result).toEqual(cachedData)
    })

    test('should handle null values in cache', () => {
      mockRequest.yar.get.mockReturnValue(null)

      const result = getMarineLicenseCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(MARINE_LICENSE_CACHE_KEY)
      expect(clone).toHaveBeenCalledWith({})
      expect(result).toEqual({})
    })
  })

  describe('setMarineLicenseCache', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      mockH = {}
      mockRequest = {
        yar: {
          get: vi.fn(),
          set: vi.fn(),
          commit: vi.fn().mockResolvedValue()
        }
      }
    })

    test('should store the value in cache', async () => {
      const value = { projectName: 'Test project', id: '123' }

      const result = await setMarineLicenseCache(mockRequest, mockH, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENSE_CACHE_KEY,
        value
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toBe(value)
    })

    test('should handle empty objects', async () => {
      const value = {}

      const cache = await setMarineLicenseCache(mockRequest, mockH, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENSE_CACHE_KEY,
        value
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(cache).toBe(value)
    })

    test('should handle undefined values and default to an empty object', async () => {
      const value = undefined

      const cache = await setMarineLicenseCache(mockRequest, mockH, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENSE_CACHE_KEY,
        {}
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

      expect(cache).toEqual({})
    })
  })
})
