import { vi } from 'vitest'
import { clone } from '@hapi/hoek'
import {
  MARINE_LICENCE_CACHE_KEY,
  SAVED_SITE_DETAILS_CACHE_KEY,
  clearMarineLicenceCache,
  clearSavedMarineLicenceSiteDetails,
  getMarineLicenceCache,
  setMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

vi.mock('@hapi/hoek', () => ({
  clone: vi.fn((data) => ({ ...data }))
}))

describe('#utils', () => {
  describe('clearMarineLicenceCache', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      mockH = {}
      mockRequest = {
        yar: {
          clear: vi.fn(),
          commit: vi.fn().mockResolvedValue()
        }
      }
    })

    test('should clear marine licence cache', async () => {
      await clearMarineLicenceCache(mockRequest, mockH)
      expect(mockRequest.yar.clear).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })
  })
  describe('getMarineLicenceCache', () => {
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

      const result = getMarineLicenceCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(MARINE_LICENCE_CACHE_KEY)
      expect(clone).toHaveBeenCalledWith({})
      expect(result).toEqual({})
    })

    test('should return a copy of cached data when it is previously set', () => {
      const cachedData = { projectName: 'Test project', id: '123' }
      mockRequest.yar.get.mockReturnValue(cachedData)

      const result = getMarineLicenceCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(MARINE_LICENCE_CACHE_KEY)
      expect(clone).toHaveBeenCalledWith(cachedData)
      expect(result).not.toBe(cachedData)
      expect(result).toEqual(cachedData)
    })

    test('should handle null values in cache', () => {
      mockRequest.yar.get.mockReturnValue(null)

      const result = getMarineLicenceCache(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(MARINE_LICENCE_CACHE_KEY)
      expect(clone).toHaveBeenCalledWith({})
      expect(result).toEqual({})
    })
  })

  describe('setMarineLicenceCache', () => {
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

      const result = await setMarineLicenceCache(mockRequest, mockH, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        value
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toBe(value)
    })

    test('should handle empty objects', async () => {
      const value = {}

      const cache = await setMarineLicenceCache(mockRequest, mockH, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        value
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(cache).toBe(value)
    })

    test('should handle undefined values and default to an empty object', async () => {
      const value = undefined

      const cache = await setMarineLicenceCache(mockRequest, mockH, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {}
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

      expect(cache).toEqual({})
    })
  })

  describe('updateMarineLicenceSiteDetails', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      mockH = {}
      mockRequest = {
        yar: {
          clear: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          commit: vi.fn().mockResolvedValue()
        }
      }
    })

    test('should store the value in cache', async () => {
      const value = { coordinatesType: 'file' }

      const result = await updateMarineLicenceSiteDetails(
        mockRequest,
        mockH,
        0,
        'coordinatesType',
        value.coordinatesType
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          siteDetails: [{ coordinatesType: 'file' }]
        }
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toEqual({ coordinatesType: 'file' })
    })

    test('should handle empty objects', async () => {
      const value = {}

      const result = await updateMarineLicenceSiteDetails(
        mockRequest,
        mockH,
        0,
        'coordinatesType',
        value.coordinatesType
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          siteDetails: [{}]
        }
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toEqual({ coordinatesType: null })
    })

    test('should handle undefined values and convert to null', async () => {
      const value = undefined

      const result = await updateMarineLicenceSiteDetails(
        mockRequest,
        mockH,
        0,
        'coordinatesType',
        value
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          siteDetails: [{}]
        }
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

      expect(result).toEqual({ coordinatesType: null })
    })

    test('should handle null values correctly', async () => {
      const value = null

      const result = await updateMarineLicenceSiteDetails(
        mockRequest,
        mockH,
        0,
        'coordinatesType',
        value
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          siteDetails: [{}]
        }
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

      expect(result).toEqual({ coordinatesType: null })
    })
  })

  describe('clearSavedMarineLicenceSiteDetails', () => {
    test('should clear the value in cache', async () => {
      const mockH = {}
      const mockRequest = {
        yar: {
          clear: vi.fn(),
          commit: vi.fn().mockResolvedValue()
        }
      }

      await clearSavedMarineLicenceSiteDetails(mockRequest, mockH)

      expect(mockRequest.yar.clear).toHaveBeenCalledWith(
        SAVED_SITE_DETAILS_CACHE_KEY
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })
  })
})
