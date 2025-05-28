import {
  getExemptionCache,
  setExemptionCache,
  updateExemptionSiteDetails,
  resetExemptionSiteDetails,
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

  describe('updateExemptionSiteDetails', () => {
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
      const value = { coordinatesType: 'file' }

      const result = updateExemptionSiteDetails(
        mockRequest,
        'coordinatesType',
        value.coordinatesType
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: value
      })
      expect(result).toEqual(value)
    })

    test('should handle empty objects', () => {
      const value = {}

      const result = updateExemptionSiteDetails(
        mockRequest,
        'coordinatesType',
        value.coordinatesType
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: value
      })
      expect(result).toEqual({ coordinatesType: undefined })
    })

    test('should handle undefined values and default to an empty object', () => {
      const value = undefined

      const result = updateExemptionSiteDetails(
        mockRequest,
        'coordinatesType',
        value
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: { coordinatesType: undefined }
      })

      expect(result).toEqual({})
    })
  })

  describe('resetExemptionSiteDetails', () => {
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

    test('should clear the value in cache', () => {
      const result = resetExemptionSiteDetails(mockRequest)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {})
      expect(result).toEqual({ siteDetails: null })
    })
  })
})
