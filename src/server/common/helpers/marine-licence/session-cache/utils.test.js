import { vi } from 'vitest'
import { clone } from '@hapi/hoek'
import {
  MARINE_LICENCE_CACHE_KEY,
  SAVED_SITE_DETAILS_CACHE_KEY,
  clearMarineLicenceCache,
  clearSavedMarineLicenceSiteDetails,
  clearSingleSiteMode,
  getMarineLicenceCache,
  getSavedSiteDetails,
  setMarineLicenceCache,
  setSavedSiteDetails,
  updateMarineLicenceSiteActivityDetails,
  updateMarineLicenceSiteDetails,
  updateMarineLicenceSiteDetailsBatch,
  updateMarineLicenceSiteDetailsMultiple,
  getSingleSiteMode,
  setSingleSiteMode,
  updateSingleSiteLocation
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { SINGLE_SITE_MODE_KEY } from '#src/server/common/constants/cache.js'

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

  describe('updateMarineLicenceSiteActivityDetails', () => {
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

    test('should update the provided fields in the correct activity object', async () => {
      mockRequest.yar.get.mockReturnValue({
        siteDetails: [
          {
            activityDetails: [
              { activityType: 'construction' },
              { activityType: 'deposit' }
            ]
          }
        ]
      })

      const result = await updateMarineLicenceSiteActivityDetails(
        mockRequest,
        mockH,
        0,
        1,
        {
          activityType: 'removal',
          activitySubType: 'removal-type-2'
        }
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          siteDetails: [
            {
              activityDetails: [
                { activityType: 'construction' },
                {
                  activityType: 'removal',
                  activitySubType: 'removal-type-2'
                }
              ]
            }
          ]
        }
      )
      expect(result).toEqual({
        activityDetails: [
          { activityType: 'construction' },
          {
            activityType: 'removal',
            activitySubType: 'removal-type-2'
          }
        ]
      })
    })

    test('should leave other activity objects in the array unchanged', async () => {
      mockRequest.yar.get.mockReturnValue({
        siteDetails: [
          {
            activityDetails: [
              { activityType: 'construction', activityDescription: 'Building' },
              { activityType: 'deposit', activityDescription: 'Dumping' }
            ]
          }
        ]
      })

      await updateMarineLicenceSiteActivityDetails(mockRequest, mockH, 0, 0, {
        activityType: 'removal'
      })

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          siteDetails: [
            {
              activityDetails: [
                { activityType: 'removal', activityDescription: 'Building' },
                { activityType: 'deposit', activityDescription: 'Dumping' }
              ]
            }
          ]
        }
      )
    })

    test('should initialise activityDetails as empty array if site has none', async () => {
      mockRequest.yar.get.mockReturnValue({
        siteDetails: [{}]
      })

      const result = await updateMarineLicenceSiteActivityDetails(
        mockRequest,
        mockH,
        0,
        0,
        {
          activityType: 'construction'
        }
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          siteDetails: [{ activityDetails: [{ activityType: 'construction' }] }]
        }
      )
      expect(result).toEqual({
        activityDetails: [{ activityType: 'construction' }]
      })
    })

    test('should return the activityDetails array', async () => {
      mockRequest.yar.get.mockReturnValue({
        siteDetails: [{ activityDetails: [{ activityType: 'construction' }] }]
      })

      const result = await updateMarineLicenceSiteActivityDetails(
        mockRequest,
        mockH,
        0,
        0,
        {
          activityType: 'deposit'
        }
      )

      expect(result).toEqual({ activityDetails: [{ activityType: 'deposit' }] })
    })
  })

  describe('updateMarineLicenceSiteDetailsBatch', () => {
    let mockRequest

    const mockStatus = {
      filename: 'test-file',
      status: 'ready',
      s3Location: {
        s3Bucket: 'test-bucket',
        s3Key: 'test-key',
        fileId: 'test-file-id',
        s3Url: 'https://test-url',
        checksumSha256: 'test-checksum'
      }
    }

    const mockS3Location = {
      s3Bucket: 'test-bucket',
      s3Key: 'test-key'
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

      const result = updateMarineLicenceSiteDetailsBatch(
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
            s3Bucket: 'test-bucket',
            s3Key: 'test-key',
            fileId: 'test-file-id',
            s3Url: 'https://test-url',
            checksumSha256: 'test-checksum'
          }
        },
        s3Location: {
          s3Bucket: mockS3Location.s3Bucket,
          s3Key: mockS3Location.s3Key,
          fileId: mockStatus.s3Location.fileId,
          s3Url: mockStatus.s3Location.s3Url,
          checksumSha256: mockStatus.s3Location.checksumSha256
        },
        extractedCoordinates: expect.any(Array),
        geoJSON: mockCoordinateData.geoJSON,
        featureCount: 1,
        uploadConfig: null
      }

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          projectName: 'Test Project',
          siteDetails: [expected]
        }
      )

      expect(result).toEqual([expected])
    })

    test('should update multiple siteDetails properties in a single operation for multiple sites', () => {
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

      const result = updateMarineLicenceSiteDetailsBatch(
        mockRequest,
        mockStatus,
        mockCoordinateData,
        mockS3Location,
        { isMultipleSitesFile: true }
      )

      const expectedS3Location = {
        s3Bucket: mockS3Location.s3Bucket,
        s3Key: mockS3Location.s3Key,
        fileId: mockStatus.s3Location.fileId,
        s3Url: mockStatus.s3Location.s3Url,
        checksumSha256: mockStatus.s3Location.checksumSha256
      }

      const expected = [
        {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: mockStatus,
          s3Location: expectedS3Location,
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
          uploadedFile: mockStatus,
          s3Location: expectedS3Location,
          extractedCoordinates: expect.any(Array),
          geoJSON: {
            type: 'FeatureCollection',
            features: [mockCoordinateData.geoJSON.features[1]]
          },
          featureCount: 1,
          uploadConfig: null
        }
      ]

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          projectName: 'Test Project',
          siteDetails: expected
        }
      )

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

      const result = updateMarineLicenceSiteDetailsBatch(
        mockRequest,
        mockStatus,
        mockCoordinateData,
        mockS3Location,
        { isMultipleSitesFile: false }
      )

      const expected = {
        coordinatesType: undefined,
        fileUploadType: undefined,
        uploadedFile: mockStatus,
        s3Location: {
          s3Bucket: mockS3Location.s3Bucket,
          s3Key: mockS3Location.s3Key,
          fileId: mockStatus.s3Location.fileId,
          s3Url: mockStatus.s3Location.s3Url,
          checksumSha256: mockStatus.s3Location.checksumSha256
        },
        extractedCoordinates: expect.any(Array),
        geoJSON: mockCoordinateData.geoJSON,
        featureCount: 1,
        uploadConfig: null
      }

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          projectName: 'Test Project',
          siteDetails: [expected]
        }
      )

      expect(result).toEqual([expected])
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

  describe('getSavedSiteDetails', () => {
    let mockRequest

    beforeEach(() => {
      mockRequest = { yar: { get: vi.fn() } }
    })

    test('should return the stored value when it exists', () => {
      const savedDetails = { originalCoordinatesEntry: 'single' }
      mockRequest.yar.get.mockReturnValue(savedDetails)

      const result = getSavedSiteDetails(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(
        SAVED_SITE_DETAILS_CACHE_KEY
      )
      expect(result).toBe(savedDetails)
    })

    test('should return {} when the cache is empty', () => {
      mockRequest.yar.get.mockReturnValue(null)

      const result = getSavedSiteDetails(mockRequest)

      expect(result).toEqual({})
    })
  })

  describe('setSavedSiteDetails', () => {
    test('should set the value and commit the session', async () => {
      const mockH = {}
      const mockRequest = {
        yar: {
          set: vi.fn(),
          commit: vi.fn().mockResolvedValue()
        }
      }
      const values = {
        originalCoordinatesEntry: 'single',
        originalCoordinateSystem: 'wgs84'
      }

      await setSavedSiteDetails(mockRequest, mockH, values)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        SAVED_SITE_DETAILS_CACHE_KEY,
        values
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })
  })

  describe('setSingleSiteMode', () => {
    test('should set the single site mode key with siteIndex object and commit', async () => {
      const mockH = {}
      const mockRequest = {
        yar: {
          set: vi.fn(),
          commit: vi.fn().mockResolvedValue()
        }
      }

      await setSingleSiteMode(mockRequest, mockH, 2)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(SINGLE_SITE_MODE_KEY, {
        siteIndex: 2
      })
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })
  })

  describe('getSingleSiteMode', () => {
    test('should return the stored object when single site mode key is set', () => {
      const stored = { siteIndex: 1 }
      const mockRequest = { yar: { get: vi.fn().mockReturnValue(stored) } }

      expect(getSingleSiteMode(mockRequest)).toBe(stored)
      expect(mockRequest.yar.get).toHaveBeenCalledWith(SINGLE_SITE_MODE_KEY)
    })

    test('should return null when single site mode key is not set', () => {
      const mockRequest = { yar: { get: vi.fn().mockReturnValue(null) } }

      expect(getSingleSiteMode(mockRequest)).toBeNull()
    })
  })

  describe('clearSingleSiteMode', () => {
    test('should clear the single site mode key and commit', async () => {
      const mockH = {}
      const mockRequest = {
        yar: {
          clear: vi.fn(),
          commit: vi.fn().mockResolvedValue()
        }
      }

      await clearSingleSiteMode(mockRequest, mockH)

      expect(mockRequest.yar.clear).toHaveBeenCalledWith(SINGLE_SITE_MODE_KEY)
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })
  })

  describe('updateMarineLicenceSiteDetailsMultiple', () => {
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

    test('should set non-null values on the site', async () => {
      mockRequest.yar.get.mockReturnValue({
        siteDetails: [{ coordinatesEntry: 'single', coordinateSystem: 'wgs84' }]
      })

      await updateMarineLicenceSiteDetailsMultiple(mockRequest, mockH, 0, {
        coordinateSystem: 'osgb36'
      })

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          siteDetails: [
            { coordinatesEntry: 'single', coordinateSystem: 'osgb36' }
          ]
        }
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })

    test('should delete keys whose value is null', async () => {
      mockRequest.yar.get.mockReturnValue({
        siteDetails: [
          {
            coordinatesEntry: 'single',
            coordinateSystem: 'wgs84',
            coordinates: {},
            circleWidth: '500'
          }
        ]
      })

      await updateMarineLicenceSiteDetailsMultiple(mockRequest, mockH, 0, {
        coordinateSystem: null,
        coordinates: null,
        circleWidth: null
      })

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          siteDetails: [{ coordinatesEntry: 'single' }]
        }
      )
    })

    test('should delete keys whose value is undefined', async () => {
      mockRequest.yar.get.mockReturnValue({
        siteDetails: [{ coordinateSystem: 'wgs84' }]
      })

      await updateMarineLicenceSiteDetailsMultiple(mockRequest, mockH, 0, {
        coordinateSystem: undefined
      })

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          siteDetails: [{}]
        }
      )
    })

    test('should leave unrelated fields untouched', async () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: [
          {
            coordinatesEntry: 'single',
            coordinateSystem: 'wgs84',
            siteName: 'My Site'
          }
        ]
      })

      await updateMarineLicenceSiteDetailsMultiple(mockRequest, mockH, 0, {
        coordinateSystem: null
      })

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        {
          projectName: 'Test Project',
          siteDetails: [{ coordinatesEntry: 'single', siteName: 'My Site' }]
        }
      )
    })
  })

  describe('updateSingleSiteLocation', () => {
    const mockStatus = {
      filename: 'test-file.kml',
      status: 'ready',
      s3Location: {
        s3Bucket: 'test-bucket',
        s3Key: 'test-key',
        fileId: 'test-file-id',
        s3Url: 'https://test-url',
        checksumSha256: 'test-checksum'
      }
    }

    const mockS3Location = { s3Bucket: 'test-bucket', s3Key: 'test-key' }

    const mockCoordinateData = {
      extractedCoordinates: [[[-1.23, 50.99]]],
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-1.23, 50.99] }
          }
        ]
      }
    }

    test('should update only the target site, preserving other sites and site-level data', () => {
      const existingCache = {
        projectName: 'Test Project',
        siteDetails: [
          {
            siteName: 'Site A',
            activityDetails: [{ activityType: 'construction' }],
            coordinatesType: 'file',
            fileUploadType: 'kml'
          },
          {
            siteName: 'Site B',
            activityDetails: [{ activityType: 'deposit' }],
            coordinatesType: 'file',
            fileUploadType: 'kml'
          }
        ]
      }

      const mockRequest = {
        yar: { get: vi.fn().mockReturnValue(existingCache), set: vi.fn() }
      }

      updateSingleSiteLocation(
        mockRequest,
        mockStatus,
        mockCoordinateData,
        mockS3Location,
        1
      )

      const [, setCall] = mockRequest.yar.set.mock.calls[0]

      expect(setCall.siteDetails[0]).toEqual(existingCache.siteDetails[0])

      expect(setCall.siteDetails[1]).toMatchObject({
        siteName: 'Site B',
        activityDetails: [{ activityType: 'deposit' }],
        extractedCoordinates: mockCoordinateData.extractedCoordinates,
        geoJSON: mockCoordinateData.geoJSON,
        featureCount: 1,
        uploadConfig: null
      })
    })

    test('should write updated siteDetails to the cache', () => {
      const existingCache = {
        projectName: 'Test Project',
        siteDetails: [
          { siteName: 'Site A', coordinatesType: 'file', fileUploadType: 'kml' }
        ]
      }

      const mockRequest = {
        yar: { get: vi.fn().mockReturnValue(existingCache), set: vi.fn() }
      }

      updateSingleSiteLocation(
        mockRequest,
        mockStatus,
        mockCoordinateData,
        mockS3Location,
        0
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        MARINE_LICENCE_CACHE_KEY,
        expect.objectContaining({
          projectName: 'Test Project',
          siteDetails: expect.any(Array)
        })
      )
    })
  })
})
