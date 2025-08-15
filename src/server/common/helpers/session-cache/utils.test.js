import { clone } from '@hapi/hoek'
import {
  EXEMPTION_CACHE_KEY,
  clearExemptionCache,
  getExemptionCache,
  resetExemptionSiteDetails,
  setExemptionCache,
  updateExemptionSiteDetails,
  updateExemptionSiteDetailsBatch
} from '~/src/server/common/helpers/session-cache/utils.js'

jest.mock('@hapi/hoek', () => ({
  clone: jest.fn((data) => ({ ...data }))
}))

describe('#utils', () => {
  describe('clearExemptionCache', () => {
    let mockRequest

    beforeEach(() => {
      jest.clearAllMocks()

      mockRequest = {
        yar: {
          clear: jest.fn()
        }
      }
    })

    test('should clear exemption cache', () => {
      clearExemptionCache(mockRequest)
      expect(mockRequest.yar.clear).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY)
    })
  })

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
        siteDetails: { coordinatesType: null }
      })
      expect(result).toEqual({ coordinatesType: null })
    })

    test('should handle undefined values and convert to null', () => {
      const value = undefined

      const result = updateExemptionSiteDetails(
        mockRequest,
        'coordinatesType',
        value
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: { coordinatesType: null }
      })

      expect(result).toEqual({ coordinatesType: null })
    })

    test('should handle null values correctly', () => {
      const value = null

      const result = updateExemptionSiteDetails(
        mockRequest,
        'coordinatesType',
        value
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: { coordinatesType: null }
      })

      expect(result).toEqual({ coordinatesType: null })
    })
  })

  describe('updateExemptionSiteDetailsBatch', () => {
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

    test('should update multiple siteDetails properties in a single operation', () => {
      const existingCache = {
        projectName: 'Test Project',
        siteDetails: {
          coordinatesType: 'file',
          existingProperty: 'keepThis'
        }
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const updates = {
        uploadedFile: { filename: 'test.kml', status: 'ready' },
        extractedCoordinates: [{ lat: 50, lng: -1 }],
        geoJSON: { type: 'FeatureCollection', features: [] },
        featureCount: 1
      }

      const result = updateExemptionSiteDetailsBatch(mockRequest, updates)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        projectName: 'Test Project',
        siteDetails: {
          coordinatesType: 'file',
          existingProperty: 'keepThis',
          uploadedFile: { filename: 'test.kml', status: 'ready' },
          extractedCoordinates: [{ lat: 50, lng: -1 }],
          geoJSON: { type: 'FeatureCollection', features: [] },
          featureCount: 1
        }
      })

      expect(result).toEqual({
        coordinatesType: 'file',
        existingProperty: 'keepThis',
        uploadedFile: { filename: 'test.kml', status: 'ready' },
        extractedCoordinates: [{ lat: 50, lng: -1 }],
        geoJSON: { type: 'FeatureCollection', features: [] },
        featureCount: 1
      })
    })

    test('should handle empty siteDetails', () => {
      const existingCache = { projectName: 'Test Project' }
      mockRequest.yar.get.mockReturnValue(existingCache)

      const updates = { newProperty: 'newValue' }
      const result = updateExemptionSiteDetailsBatch(mockRequest, updates)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        projectName: 'Test Project',
        siteDetails: { newProperty: 'newValue' }
      })

      expect(result).toEqual({ newProperty: 'newValue' })
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
