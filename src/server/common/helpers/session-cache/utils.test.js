import { clone } from '@hapi/hoek'
import {
  EXEMPTION_CACHE_KEY,
  clearExemptionCache,
  getExemptionCache,
  resetExemptionSiteDetails,
  setExemptionCache,
  updateExemptionSiteDetails,
  updateExemptionSiteDetailsBatch,
  updateExemptionMultipleSiteDetails
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
        0,
        'coordinatesType',
        value.coordinatesType
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: [value]
      })
      expect(result).toEqual(value)
    })

    test('should handle empty objects', () => {
      const value = {}

      const result = updateExemptionSiteDetails(
        mockRequest,
        0,
        'coordinatesType',
        value.coordinatesType
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: [{ coordinatesType: null }]
      })
      expect(result).toEqual({ coordinatesType: null })
    })

    test('should handle undefined values and convert to null', () => {
      const value = undefined

      const result = updateExemptionSiteDetails(
        mockRequest,
        0,
        'coordinatesType',
        value
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: [{ coordinatesType: null }]
      })

      expect(result).toEqual({ coordinatesType: null })
    })

    test('should handle null values correctly', () => {
      const value = null

      const result = updateExemptionSiteDetails(
        mockRequest,
        0,
        'coordinatesType',
        value
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        siteDetails: [{ coordinatesType: null }]
      })

      expect(result).toEqual({ coordinatesType: null })
    })
  })

  describe('updateExemptionMultipleSiteDetails', () => {
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

    test('should store the value in multipleSiteDetails cache', () => {
      const existingCache = {
        projectName: 'Test Project',
        multipleSiteDetails: {
          multipleSitesEnabled: true
        }
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const result = updateExemptionMultipleSiteDetails(
        mockRequest,
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
      expect(result).toEqual({ sameActivityDates: 'yes' })
    })

    test('should handle empty multipleSiteDetails', () => {
      const existingCache = {
        projectName: 'Test Project'
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const result = updateExemptionMultipleSiteDetails(
        mockRequest,
        'sameActivityDates',
        'no'
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(EXEMPTION_CACHE_KEY, {
        projectName: 'Test Project',
        multipleSiteDetails: {
          sameActivityDates: 'no'
        }
      })
      expect(result).toEqual({ sameActivityDates: 'no' })
    })

    test('should handle undefined values and convert to null', () => {
      const existingCache = {
        projectName: 'Test Project',
        multipleSiteDetails: {
          multipleSitesEnabled: true
        }
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const result = updateExemptionMultipleSiteDetails(
        mockRequest,
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

      expect(result).toEqual({ sameActivityDates: null })
    })

    test('should handle null values correctly', () => {
      const existingCache = {
        projectName: 'Test Project',
        multipleSiteDetails: {
          multipleSitesEnabled: true
        }
      }

      mockRequest.yar.get.mockReturnValue(existingCache)

      const result = updateExemptionMultipleSiteDetails(
        mockRequest,
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
      jest.clearAllMocks()

      mockRequest = {
        yar: {
          get: jest.fn(),
          set: jest.fn()
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
