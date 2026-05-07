import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  saveSiteDetailsToBackend,
  prepareFileUploadDataForSave,
  prepareManualCoordinateDataForSave
} from './save-site-details.js'
import { authenticatedPatchRequest } from '../authenticated-requests.js'
import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from './session-cache/utils.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import Boom from '@hapi/boom'
import {
  mockMarineLicenceApplication,
  mockManualCoordinatesMarineLicence
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'

vi.mock('../authenticated-requests.js')
vi.mock('./session-cache/utils.js')

describe('save-site-details', () => {
  const mockRequest = createMockRequest()
  const mockH = {}

  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
    vi.mocked(setMarineLicenceCache).mockResolvedValue({})
  })

  describe('prepareFileUploadDataForSave', () => {
    test('should format file upload data correctly for single site', () => {
      const siteDetails = [mockMarineLicenceApplication.siteDetails[0]]
      const result = prepareFileUploadDataForSave(siteDetails, mockRequest)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        coordinatesType: 'file',
        fileUploadType: 'kml',
        activityDetails:
          mockMarineLicenceApplication.siteDetails[0].activityDetails,
        geoJSON: mockMarineLicenceApplication.siteDetails[0].geoJSON,
        featureCount: mockMarineLicenceApplication.siteDetails[0].featureCount,
        siteName: 'test site name',
        uploadedFile: { filename: 'test-upload-id' },
        s3Location: {
          s3Bucket: 'test-bucket',
          s3Key: 'test-key',
          checksumSha256: 'test-checksum'
        }
      })

      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        {
          fileType: 'kml',
          featureCount: 1,
          filename: 'test-upload-id'
        },
        'Saving file upload site details'
      )
    })

    test('should correctly format data for API submission and copy activity data when same flags are yes', () => {
      const siteDetails = [
        {
          fileUploadType: 'kml',
          geoJSON: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [51.5074, -0.1278]
                }
              }
            ]
          },
          featureCount: 1,
          uploadedFile: {
            filename: 'test-site.kml'
          },
          s3Location: {
            s3Bucket: 'test-bucket',
            s3Key: 'test-key',
            checksumSha256: 'test-checksum'
          }
        },
        {
          fileUploadType: 'kml',
          geoJSON: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [51.5075, -0.1279]
                }
              }
            ]
          },
          featureCount: 1,
          uploadedFile: {
            filename: 'test-site.kml'
          },
          s3Location: {
            s3Bucket: 'test-bucket',
            s3Key: 'test-key-2',
            checksumSha256: 'test-checksum-2'
          }
        }
      ]

      vi.mocked(getMarineLicenceCache).mockReturnValue(
        mockMarineLicenceApplication
      )

      const result = prepareFileUploadDataForSave(siteDetails, mockRequest)

      expect(result[0]).toEqual({
        coordinatesType: 'file',
        fileUploadType: 'kml',
        geoJSON: siteDetails[0].geoJSON,
        featureCount: 1,
        siteName: undefined,
        uploadedFile: {
          filename: 'test-site.kml'
        },
        s3Location: {
          s3Bucket: 'test-bucket',
          s3Key: 'test-key',
          checksumSha256: 'test-checksum'
        }
      })

      expect(result[1]).toEqual({
        coordinatesType: 'file',
        fileUploadType: 'kml',
        geoJSON: siteDetails[1].geoJSON,
        featureCount: 1,
        siteName: undefined,
        uploadedFile: {
          filename: 'test-site.kml'
        },
        s3Location: {
          s3Bucket: 'test-bucket',
          s3Key: 'test-key-2',
          checksumSha256: 'test-checksum-2'
        }
      })
    })

    test('should handle missing featureCount', () => {
      const siteDetails = [
        {
          fileUploadType: 'shapefile',
          geoJSON: { type: 'FeatureCollection', features: [] },
          uploadedFile: {
            filename: 'test.shp'
          },
          s3Location: {
            s3Bucket: 'bucket',
            s3Key: 'key',
            checksumSha256: 'checksum'
          }
        }
      ]

      const result = prepareFileUploadDataForSave(siteDetails, mockRequest)[0]

      expect(result.featureCount).toBe(0)
    })
  })

  describe('prepareManualCoordinateDataForSave', () => {
    test('should return a structured object for single coordinate entry including circleWidth', () => {
      const siteDetails = [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '51.489676', longitude: '-0.231530' },
          circleWidth: '100',
          siteName: 'Test site',
          activityDetails: { description: 'Test activity' },
          someUiOnlyField: 'should not appear'
        }
      ]

      const result = prepareManualCoordinateDataForSave(siteDetails)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        coordinatesType: 'coordinates',
        coordinatesEntry: 'single',
        coordinateSystem: 'wgs84',
        coordinates: { latitude: '51.489676', longitude: '-0.231530' },
        circleWidth: '100',
        siteName: 'Test site',
        activityDetails: { description: 'Test activity' }
      })
      expect(result[0]).not.toHaveProperty('someUiOnlyField')
    })

    test('should return a structured object for multiple coordinate entry without circleWidth', () => {
      const siteDetails = [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '51.489676', longitude: '-0.231530' },
            { latitude: '51.490000', longitude: '-0.230000' },
            { latitude: '51.488000', longitude: '-0.232000' }
          ],
          circleWidth: '100',
          siteName: 'Test polygon site',
          activityDetails: null
        }
      ]

      const result = prepareManualCoordinateDataForSave(siteDetails)

      expect(result).toHaveLength(1)
      expect(result[0]).not.toHaveProperty('circleWidth')
      expect(result[0]).toEqual({
        coordinatesType: 'coordinates',
        coordinatesEntry: 'multiple',
        coordinateSystem: 'wgs84',
        coordinates: siteDetails[0].coordinates,
        siteName: 'Test polygon site',
        activityDetails: null
      })
    })
  })

  describe('saveSiteDetailsToBackend', () => {
    test('should save site details successfully with single site option', async () => {
      vi.mocked(authenticatedPatchRequest).mockResolvedValue({
        payload: { success: true }
      })

      await saveSiteDetailsToBackend(mockRequest, mockH, { siteIndex: 0 })

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        mockRequest,
        apiRoutes.UPDATE_MARINE_LICENCE_SITE,
        {
          siteDetails: mockMarineLicenceApplication.siteDetails[0],
          siteIndex: 0,
          id: mockMarineLicenceApplication.id
        }
      )

      expect(vi.mocked(setMarineLicenceCache)).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        expect.objectContaining({
          ...mockMarineLicenceApplication,
          siteDetails: expect.any(Array)
        })
      )

      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        {
          marineLicenceId: mockMarineLicenceApplication.id,
          siteCount: 1,
          coordinatesType: 'file',
          isSingleSite: true
        },
        'Successfully saved site details to backend'
      )
    })

    test('should save file upload site details successfully', async () => {
      vi.mocked(authenticatedPatchRequest).mockResolvedValue({
        payload: { success: true }
      })

      await saveSiteDetailsToBackend(mockRequest, mockH)

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        mockRequest,
        apiRoutes.UPDATE_MARINE_LICENCE_SITE_DETAILS,
        {
          siteDetails: expect.any(Array),
          id: mockMarineLicenceApplication.id
        }
      )

      expect(vi.mocked(setMarineLicenceCache)).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        expect.objectContaining({
          ...mockMarineLicenceApplication,
          siteDetails: expect.any(Array)
        })
      )

      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        {
          marineLicenceId: mockMarineLicenceApplication.id,
          siteCount: 1,
          coordinatesType: 'file',
          isSingleSite: false
        },
        'Successfully saved site details to backend'
      )
    })

    test('should save manual coordinate site details successfully', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue(
        mockManualCoordinatesMarineLicence
      )
      vi.mocked(authenticatedPatchRequest).mockResolvedValue({
        payload: { success: true }
      })

      await saveSiteDetailsToBackend(mockRequest, mockH)

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        mockRequest,
        apiRoutes.UPDATE_MARINE_LICENCE_SITE_DETAILS,
        {
          siteDetails: expect.any(Array),
          id: mockManualCoordinatesMarineLicence.id
        }
      )

      expect(vi.mocked(setMarineLicenceCache)).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        expect.objectContaining({
          ...mockManualCoordinatesMarineLicence,
          siteDetails: expect.any(Array)
        })
      )

      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        {
          marineLicenceId: mockManualCoordinatesMarineLicence.id,
          siteCount: 1,
          coordinatesType: 'coordinates',
          isSingleSite: false
        },
        'Successfully saved site details to backend'
      )
    })

    test('should throw error when Marine Licence ID is missing', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        id: null
      })

      const expectedError = Boom.unauthorized(
        'Marine Licence ID is required to save site details'
      )
      expectedError.redirectPath = '/projects'

      await expect(
        saveSiteDetailsToBackend(mockRequest, mockH)
      ).rejects.toThrow(expectedError)
    })

    test('should throw error when site details are missing', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: []
      })

      await expect(
        saveSiteDetailsToBackend(mockRequest, mockH)
      ).rejects.toThrow('Site details are required to save')
    })

    test('should handle save failure and log error', async () => {
      const error = new Error('Save failed')
      vi.mocked(authenticatedPatchRequest).mockRejectedValue(error)

      await expect(
        saveSiteDetailsToBackend(mockRequest, mockH)
      ).rejects.toThrow('Save failed')
    })
  })
})
