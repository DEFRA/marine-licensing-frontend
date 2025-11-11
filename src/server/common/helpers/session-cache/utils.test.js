import { vi } from 'vitest'
import { clone } from '@hapi/hoek'
import {
  EXEMPTION_CACHE_KEY,
  clearExemptionCache,
  getExemptionCache,
  resetExemptionSiteDetails,
  setExemptionCache,
  updateExemptionSiteDetails,
  updateExemptionSiteDetailsBatch,
  updateExemptionMultipleSiteDetails,
  clearSiteDetails,
  clearSavedSiteDetails,
  SAVED_SITE_DETAILS_CACHE_KEY,
  setSavedSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'

vi.mock('@hapi/hoek', () => ({
  clone: vi.fn((data) => ({ ...data }))
}))

describe('#utils', () => {
  describe('clearExemptionCache', () => {
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

    test('should clear exemption cache', async () => {
      await clearExemptionCache(mockRequest, mockH)
      expect(mockRequest.yar.clear).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY)
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })
  })

  describe('getExemptionCache', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = {
        yar: {
          get: vi.fn(),
          commit: vi.fn()
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
      const value = { projectName: 'Test project' }

      const result = await setExemptionCache(mockRequest, mockH, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        EXEMPTION_CACHE_KEY,
        value
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toBe(value)
    })

    test('should handle empty objects', async () => {
      const value = {}

      const cache = await setExemptionCache(mockRequest, mockH, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        EXEMPTION_CACHE_KEY,
        value
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(cache).toBe(value)
    })

    test('should handle undefined values and default to an empty object', async () => {
      const value = undefined

      const cache = await setExemptionCache(mockRequest, mockH, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {})
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

      expect(cache).toEqual({})
    })
  })

  describe('clearSiteDetails', () => {
    test('should reset value', async () => {
      const expected = { projectName: 'Test project' }

      const mockRequest = {
        yar: {
          get: vi.fn().mockReturnValue(expected),
          set: vi.fn(),
          commit: vi.fn()
        }
      }

      const value = {
        projectName: 'Test project',
        siteDetails: [{ siteName: 'test' }],
        multipleSiteDetails: { multipleSitesEnabled: true }
      }

      const result = await clearSiteDetails(mockRequest, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        EXEMPTION_CACHE_KEY,
        expected
      )

      expect(result).toBe(expected)
    })
  })

  describe('updateExemptionSiteDetails', () => {
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
      const value = { coordinatesType: 'file' }

      const result = await updateExemptionSiteDetails(
        mockRequest,
        mockH,
        0,
        'coordinatesType',
        value.coordinatesType
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: [value]
      })
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toEqual({ coordinatesType: 'file' })
    })

    test('should handle empty objects', async () => {
      const value = {}

      const result = await updateExemptionSiteDetails(
        mockRequest,
        mockH,
        0,
        'coordinatesType',
        value.coordinatesType
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: [{}]
      })
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toEqual({ coordinatesType: null })
    })

    test('should handle undefined values and convert to null', async () => {
      const value = undefined

      const result = await updateExemptionSiteDetails(
        mockRequest,
        mockH,
        0,
        'coordinatesType',
        value
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: [{}]
      })
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

      expect(result).toEqual({ coordinatesType: null })
    })

    test('should handle null values correctly', async () => {
      const value = null

      const result = await updateExemptionSiteDetails(
        mockRequest,
        mockH,
        0,
        'coordinatesType',
        value
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: [{}]
      })
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

      expect(result).toEqual({ coordinatesType: null })
    })
  })

  describe('updateExemptionMultipleSiteDetails', () => {
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

    test('should store the value in multipleSiteDetails cache', async () => {
      const existingCache = {
        projectName: 'Test Project',
        multipleSiteDetails: {
          multipleSitesEnabled: true
        }
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const result = await updateExemptionMultipleSiteDetails(
        mockRequest,
        mockH,
        'sameActivityDates',
        'yes'
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        projectName: 'Test Project',
        multipleSiteDetails: {
          multipleSitesEnabled: true,
          sameActivityDates: 'yes'
        }
      })
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toEqual({ sameActivityDates: 'yes' })
    })

    test('should handle empty multipleSiteDetails', async () => {
      const existingCache = {
        projectName: 'Test Project'
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const result = await updateExemptionMultipleSiteDetails(
        mockRequest,
        mockH,
        'sameActivityDates',
        'no'
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        projectName: 'Test Project',
        multipleSiteDetails: {
          sameActivityDates: 'no'
        }
      })
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toEqual({ sameActivityDates: 'no' })
    })

    test('should handle undefined values and convert to null', async () => {
      const existingCache = {
        projectName: 'Test Project',
        multipleSiteDetails: {
          multipleSitesEnabled: true
        }
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const result = await updateExemptionMultipleSiteDetails(
        mockRequest,
        mockH,
        'sameActivityDates',
        undefined
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        projectName: 'Test Project',
        multipleSiteDetails: {
          multipleSitesEnabled: true,
          sameActivityDates: null
        }
      })
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

      expect(result).toEqual({ sameActivityDates: null })
    })

    test('should handle null values correctly', async () => {
      const existingCache = {
        projectName: 'Test Project',
        multipleSiteDetails: {
          multipleSitesEnabled: true
        }
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const result = await updateExemptionMultipleSiteDetails(
        mockRequest,
        mockH,
        'sameActivityDates',
        null
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        projectName: 'Test Project',
        multipleSiteDetails: {
          multipleSitesEnabled: true,
          sameActivityDates: null
        }
      })
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)

      expect(result).toEqual({ sameActivityDates: null })
    })
  })

  describe('updateExemptionSiteDetailsBatch', () => {
    let mockRequest

    const mockStatus = {
      filename: 'test-file',
      status: 'ready',
      s3Location: {
        s3Bucket: 'test-bucket',
        s3Key: 'test-key',
        checksumSha256: 'test-checksum'
      }
    }

    const mockS3Location = {
      s3Bucket: 'test-bucket',
      s3Key: 'test-key',
      checksumSha256: 'test-checksum'
    }

    beforeEach(() => {
      mockRequest = {
        yar: {
          get: vi.fn(),
          set: vi.fn()
        }
      }
    })

    test('should update multiple siteDetails properties in a single operation for a single site', () => {
      const existingCache = {
        projectName: 'Test Project',
        siteDetails: [
          {
            coordinatesType: 'file',
            fileUploadType: 'kml'
          }
        ]
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const mockCoordinateData = {
        extractedCoordinates: [],
        geoJSON: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-1.2345, 50.9876],
                    [-1.2335, 50.9876],
                    [-1.2335, 50.9886],
                    [-1.2345, 50.9886],
                    [-1.2345, 50.9876]
                  ]
                ]
              }
            }
          ]
        }
      }

      const result = updateExemptionSiteDetailsBatch(
        mockRequest,
        mockStatus,
        mockCoordinateData,
        mockS3Location,
        { isMultipleSitesFile: false }
      )

      const expected = {
        coordinatesType: 'file',
        fileUploadType: 'kml',
        uploadedFile: {
          filename: 'test-file',
          status: 'ready',
          s3Location: {
            checksumSha256: 'test-checksum',
            s3Bucket: 'test-bucket',
            s3Key: 'test-key'
          }
        },
        s3Location: mockS3Location,
        extractedCoordinates: expect.any(Array),
        geoJSON: mockCoordinateData.geoJSON,
        featureCount: 1,
        uploadConfig: null
      }

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        projectName: 'Test Project',
        siteDetails: [expected]
      })

      expect(result).toEqual([expected])
    })

    test('should update multiple siteDetails properties in a single operation for a multiple sites', () => {
      const existingCache = {
        projectName: 'Test Project',
        siteDetails: [
          {
            coordinatesType: 'file',
            fileUploadType: 'kml'
          }
        ]
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const mockCoordinateData = {
        extractedCoordinates: [[[-1.2345, 50.9876]], [[-1.2345, 50.9876]]],
        geoJSON: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-1.2345, 50.9876],
                    [-1.2335, 50.9876],
                    [-1.2335, 50.9886],
                    [-1.2345, 50.9886],
                    [-1.2345, 50.9876]
                  ]
                ]
              }
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-1.1345, 51.9876],
                    [-1.1335, 51.9876],
                    [-1.1335, 51.9886],
                    [-1.1345, 51.9886],
                    [-1.1345, 51.9876]
                  ]
                ]
              }
            }
          ]
        }
      }

      const result = updateExemptionSiteDetailsBatch(
        mockRequest,
        mockStatus,
        mockCoordinateData,
        mockS3Location,
        { isMultipleSitesFile: true }
      )

      const expected = [
        {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test-file',
            status: 'ready',
            s3Location: {
              checksumSha256: 'test-checksum',
              s3Bucket: 'test-bucket',
              s3Key: 'test-key'
            }
          },
          s3Location: mockS3Location,
          extractedCoordinates: expect.any(Array),
          geoJSON: {
            type: 'FeatureCollection',
            features: [mockCoordinateData.geoJSON.features[0]]
          },
          featureCount: 1,
          uploadConfig: null
        },
        {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test-file',
            status: 'ready',
            s3Location: {
              checksumSha256: 'test-checksum',
              s3Bucket: 'test-bucket',
              s3Key: 'test-key'
            }
          },
          s3Location: mockS3Location,
          extractedCoordinates: expect.any(Array),
          geoJSON: {
            type: 'FeatureCollection',
            features: [mockCoordinateData.geoJSON.features[1]]
          },
          featureCount: 1,
          uploadConfig: null
        }
      ]

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        projectName: 'Test Project',
        siteDetails: expected
      })

      expect(result).toEqual(expected)
    })

    test('should handle empty siteDetails', () => {
      const existingCache = { projectName: 'Test Project' }
      mockRequest.yar.get.mockReturnValue(existingCache)

      const mockCoordinateData = {
        extractedCoordinates: [],
        geoJSON: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-1.2345, 50.9876],
                    [-1.2335, 50.9876],
                    [-1.2335, 50.9886],
                    [-1.2345, 50.9886],
                    [-1.2345, 50.9876]
                  ]
                ]
              }
            }
          ]
        }
      }

      const result = updateExemptionSiteDetailsBatch(
        mockRequest,
        mockStatus,
        mockCoordinateData,
        mockS3Location,
        { isMultipleSitesFile: false }
      )

      const expected = {
        coordinatesType: undefined,
        fileUploadType: undefined,
        uploadedFile: {
          filename: 'test-file',
          status: 'ready',
          s3Location: {
            checksumSha256: 'test-checksum',
            s3Bucket: 'test-bucket',
            s3Key: 'test-key'
          }
        },
        s3Location: mockS3Location,
        extractedCoordinates: expect.any(Array),
        geoJSON: mockCoordinateData.geoJSON,
        featureCount: 1,
        uploadConfig: null
      }

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        projectName: 'Test Project',
        siteDetails: [expected]
      })

      expect(result).toEqual([expected])
    })
  })

  describe('resetExemptionSiteDetails', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = {
        yar: {
          get: vi.fn(),
          set: vi.fn()
        }
      }
    })

    test('should clear the value in cache', () => {
      const result = resetExemptionSiteDetails(mockRequest)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        multipleSiteDetails: {},
        siteDetails: []
      })
      expect(result).toEqual({ siteDetails: null })
    })
  })

  describe('clearSavedSiteDetails', () => {
    test('should clear the value in cache', async () => {
      const mockH = {}
      const mockRequest = {
        yar: {
          clear: vi.fn(),
          commit: vi.fn().mockResolvedValue()
        }
      }

      await clearSavedSiteDetails(mockRequest, mockH)

      expect(mockRequest.yar.clear).toHaveBeenCalledWith(
        SAVED_SITE_DETAILS_CACHE_KEY
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })
  })

  describe('setSavedSiteDetails', () => {
    test('should update the value in cache', async () => {
      const value = { originalCoordinatesEntry: 'single' }

      const mockH = {}
      const mockRequest = {
        yar: {
          set: vi.fn(),
          get: vi.fn().mockReturnValue(value),
          commit: vi.fn().mockResolvedValue()
        }
      }

      const result = await setSavedSiteDetails(mockRequest, mockH, value)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        SAVED_SITE_DETAILS_CACHE_KEY,
        value
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toEqual(value)
    })

    test('should handle undefined values and default to an empty object', async () => {
      const mockH = {}
      const mockRequest = {
        yar: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn(),
          commit: vi.fn().mockResolvedValue()
        }
      }

      const result = await setSavedSiteDetails(mockRequest, mockH, undefined)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        SAVED_SITE_DETAILS_CACHE_KEY,
        {}
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
      expect(result).toEqual({})
    })
  })
})
