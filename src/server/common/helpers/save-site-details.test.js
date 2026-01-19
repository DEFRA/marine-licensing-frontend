import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  saveSiteDetailsToBackend,
  prepareFileUploadDataForSave,
  prepareManualCoordinateDataForSave
} from './save-site-details.js'
import { authenticatedPatchRequest } from './authenticated-requests.js'
import { getExemptionCache, setExemptionCache } from './session-cache/utils.js'
import {
  createMockRequest,
  mockExemption,
  mockFileUploadExemption
} from '#src/server/test-helpers/mocks.js'
import Boom from '@hapi/boom'

vi.mock('./authenticated-requests.js')
vi.mock('./session-cache/utils.js')

describe('save-site-details', () => {
  const mockRequest = createMockRequest()
  const mockH = {}

  beforeEach(() => {
    vi.mocked(getExemptionCache).mockReturnValue(mockFileUploadExemption)
    vi.mocked(setExemptionCache).mockResolvedValue({})
  })

  describe('prepareFileUploadDataForSave', () => {
    test('should format file upload data correctly for single site', () => {
      const siteDetails = [mockFileUploadExemption.siteDetails[0]]
      const result = prepareFileUploadDataForSave(siteDetails, mockRequest)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        coordinatesType: 'file',
        activityDates: mockFileUploadExemption.siteDetails[0].activityDates,
        activityDescription:
          mockFileUploadExemption.siteDetails[0].activityDescription,
        siteName: mockFileUploadExemption.siteDetails[0].siteName,
        fileUploadType: 'kml',
        geoJSON: mockFileUploadExemption.siteDetails[0].geoJSON,
        featureCount: 0,
        uploadedFile: { filename: 'test-upload-id' },
        s3Location: {
          s3Bucket: 'test-bucket',
          s3Key: 'test-key',
          checksumSha256: 'test-checksum'
        }
      })
    })

    test('should copy activity description to all sites when sameActivityDescription is yes', () => {
      const siteDetails = [
        {
          ...mockFileUploadExemption.siteDetails[0],
          activityDescription: 'Shared description'
        },
        { ...mockFileUploadExemption.siteDetails[0], activityDescription: null }
      ]

      const result = prepareFileUploadDataForSave(siteDetails, mockRequest)

      expect(result[0].activityDescription).toBe('Shared description')
      expect(result[1].activityDescription).toBe('Shared description')
    })

    test('should copy activity dates to all sites when sameActivityDates is yes', () => {
      const exemptionWithSameDates = {
        ...mockFileUploadExemption,
        multipleSiteDetails: {
          ...mockFileUploadExemption.multipleSiteDetails,
          sameActivityDates: 'yes'
        }
      }

      vi.mocked(getExemptionCache).mockReturnValue(exemptionWithSameDates)

      const siteDetails = [
        {
          ...mockFileUploadExemption.siteDetails[0],
          activityDates: { start: '2024-01-01', end: '2024-01-31' }
        },
        { ...mockFileUploadExemption.siteDetails[0], activityDates: null }
      ]

      const result = prepareFileUploadDataForSave(siteDetails, mockRequest)

      expect(result[0].activityDates).toEqual({
        start: '2024-01-01',
        end: '2024-01-31'
      })
      expect(result[1].activityDates).toEqual({
        start: '2024-01-01',
        end: '2024-01-31'
      })
    })

    test('should log save information for each site', () => {
      const siteDetails = [mockFileUploadExemption.siteDetails[0]]
      prepareFileUploadDataForSave(siteDetails, mockRequest)

      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        {
          fileType: 'kml',
          featureCount: 0,
          filename: 'test-upload-id'
        },
        'Saving file upload site details'
      )
    })

    test('should correctly format data for API submission and copy activity data when same flags are yes', () => {
      const siteDetails = [
        {
          fileUploadType: 'kml',
          activityDescription: 'First site description',
          activityDates: { start: '2025-01-01', end: '2025-01-02' },
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
          activityDescription: 'Different description',
          activityDates: { start: '2025-01-03', end: '2025-01-04' },
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

      const exemptionWithSameFlags = {
        ...mockExemption,
        multipleSiteDetails: {
          ...mockExemption.multipleSiteDetails,
          sameActivityDescription: 'yes',
          sameActivityDates: 'yes'
        }
      }

      vi.mocked(getExemptionCache).mockReturnValue(exemptionWithSameFlags)

      const result = prepareFileUploadDataForSave(siteDetails, mockRequest)

      expect(result[0]).toEqual({
        coordinatesType: 'file',
        fileUploadType: 'kml',
        activityDescription: 'First site description',
        activityDates: { start: '2025-01-01', end: '2025-01-02' },
        geoJSON: siteDetails[0].geoJSON,
        featureCount: 1,
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
        activityDescription: 'First site description', // Copied from first site
        activityDates: { start: '2025-01-01', end: '2025-01-02' }, // Copied from first site
        geoJSON: siteDetails[1].geoJSON,
        featureCount: 1,
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
    test('should return site details as-is for manual coordinate entry', () => {
      const result = prepareManualCoordinateDataForSave(
        mockExemption,
        mockRequest
      )

      expect(result).toEqual(mockExemption.siteDetails)
    })

    test('should log save information for each site', () => {
      const exemption = {
        siteDetails: [
          {
            coordinatesType: 'coordinates',
            coordinatesEntry: 'single',
            coordinates: {
              latitude: '51.5074',
              longitude: '-0.1278'
            },
            circleWidth: '100'
          }
        ]
      }

      prepareManualCoordinateDataForSave(exemption, mockRequest)

      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single'
        },
        'Saving manual coordinate site details'
      )
    })
  })

  describe('saveSiteDetailsToBackend', () => {
    test('should save file upload site details successfully', async () => {
      vi.mocked(authenticatedPatchRequest).mockResolvedValue({
        payload: { success: true }
      })

      await saveSiteDetailsToBackend(mockRequest, mockH)

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        mockRequest,
        '/exemption/site-details',
        {
          multipleSiteDetails: mockFileUploadExemption.multipleSiteDetails,
          siteDetails: expect.any(Array),
          id: mockFileUploadExemption.id
        }
      )

      expect(vi.mocked(setExemptionCache)).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        expect.objectContaining({
          ...mockFileUploadExemption,
          siteDetails: expect.any(Array)
        })
      )

      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        {
          exemptionId: mockFileUploadExemption.id,
          siteCount: 1,
          coordinatesType: 'file'
        },
        'Successfully saved site details to backend'
      )
    })

    test('should save manual coordinate site details successfully', async () => {
      const manualExemption = {
        ...mockExemption,
        siteDetails: [
          {
            coordinatesType: 'coordinates',
            coordinatesEntry: 'single',
            siteName: 'Manual Site'
          }
        ]
      }
      vi.mocked(getExemptionCache).mockReturnValue(manualExemption)
      vi.mocked(authenticatedPatchRequest).mockResolvedValue({
        payload: { success: true }
      })

      await saveSiteDetailsToBackend(mockRequest, mockH)

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        mockRequest,
        '/exemption/site-details',
        {
          multipleSiteDetails: manualExemption.multipleSiteDetails,
          siteDetails: manualExemption.siteDetails,
          id: manualExemption.id
        }
      )
    })

    test('should throw error when exemption ID is missing', async () => {
      vi.mocked(getExemptionCache).mockReturnValue({
        ...mockExemption,
        id: null
      })

      const expectedError = Boom.unauthorized(
        'Exemption ID is required to save site details'
      )
      expectedError.redirectPath = '/projects'

      await expect(
        saveSiteDetailsToBackend(mockRequest, mockH)
      ).rejects.toThrow(expectedError)
    })

    test('should throw error when site details are missing', async () => {
      vi.mocked(getExemptionCache).mockReturnValue({
        ...mockExemption,
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
