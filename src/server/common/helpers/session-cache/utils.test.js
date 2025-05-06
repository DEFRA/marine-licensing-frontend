import {
  getExemptionCache,
  setExemptionCache,
  EXEMPTION_CACHE_KEY
} from '~/src/server/common/helpers/session-cache/utils.js'
import { clone } from '@hapi/hoek'

jest.mock('@hapi/hoek', () => ({
  clone: jest.fn((data) => ({ ...data }))
}))

describe('#utils', () => {
  describe('getExemptionCache', () => {
    let mockRequest

    beforeEach(() => {
      jest.clearAllMocks()

      mockRequest = {
        yar: {
          get: jest.fn()
        }
      }
    })

    test('should return an empty object no cache is set', () => {
      mockRequest.yar.get.mockReturnValue(undefined)

      const result = getExemptionCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY)
      expect(clone).toHaveBeenCalledWith({})
      expect(result).toEqual({})
    })

    test('should return a copy of cached data when it is previously set', () => {
      const cachedData = { projectName: 'Test project' }
      mockRequest.yar.get.mockReturnValue(cachedData)

      const result = getExemptionCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY)
      expect(clone).toHaveBeenCalledWith(cachedData)
      expect(result).not.toBe(cachedData)
      expect(result).toEqual(cachedData)
    })

    test('should handle null values in cache', () => {
      mockRequest.yar.get.mockReturnValue(null)

      const result = getExemptionCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY)
      expect(clone).toHaveBeenCalledWith({})
      expect(result).toEqual({})
    })
  })

  describe('setExemptionCache', () => {
    let mockRequest

    beforeEach(() => {
      jest.clearAllMocks()

      mockRequest = {
        yar: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    })

    test('should store the value in cache', () => {
      const value = { projectName: 'Test project' }

      const result = setExemptionCache(mockRequest, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        EXEMPTION_CACHE_KEY,
        value
      )
      expect(result).toBe(value)
    })

    test('should handle empty objects', () => {
      const value = {}

      const cache = setExemptionCache(mockRequest, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        EXEMPTION_CACHE_KEY,
        value
      )
      expect(cache).toBe(value)
    })

    test('should handle undefined values and default to an empty object', () => {
      const value = undefined

      const cache = setExemptionCache(mockRequest, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {})

      expect(cache).toEqual({})
    })
  })
})
