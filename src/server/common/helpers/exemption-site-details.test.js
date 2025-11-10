import { vi } from 'vitest'
import {
  processFileUploadSiteDetails,
  processManualSiteDetails,
  processSiteDetails,
  errorMessages,
  getReviewSummaryText
} from './exemption-site-details.js'

import {
  getCoordinateSystemText,
  getCoordinateDisplayText,
  getFileUploadSummaryData,
  getPolygonCoordinatesDisplayData
} from '#src/server/exemption/site-details/review-site-details/utils.js'

vi.mock(
  '~/src/server/exemption/site-details/review-site-details/utils.js',
  () => ({
    getCoordinateSystemText: vi.fn(),
    getCoordinateDisplayText: vi.fn(),
    getFileUploadSummaryData: vi.fn(),
    getPolygonCoordinatesDisplayData: vi.fn()
  })
)

describe('exemption-site-details helper', () => {
  let mockRequest
  let mockLogger

  beforeEach(() => {
    mockLogger = {
      error: vi.fn()
    }
    mockRequest = {
      logger: mockLogger
    }
  })

  describe('errorMessages', () => {
    test('should export FILE_UPLOAD_DATA_ERROR message', () => {
      expect(errorMessages.FILE_UPLOAD_DATA_ERROR).toBe(
        'Error getting file upload summary data'
      )
    })
  })

  describe('processFileUploadSiteDetails', () => {
    const mockExemptionId = 'test-exemption-123'
    const baseFileUploadExemption = {
      siteDetails: [
        {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test-site.kml'
          }
        }
      ]
    }

    test('should process file upload site details successfully with KML file', () => {
      const mockFileUploadData = {
        method: 'Upload a file with the coordinates of the site',
        fileUploadType: 'KML',
        uploadedFile: { filename: 'test-site.kml' },
        coordinates: [
          {
            type: 'Point',
            coordinates: [51.5074, -0.1278]
          }
        ]
      }

      getFileUploadSummaryData.mockReturnValue(mockFileUploadData)

      const result = processFileUploadSiteDetails(
        baseFileUploadExemption,
        mockExemptionId,
        mockRequest,
        0
      )

      expect(getFileUploadSummaryData).toHaveBeenCalledWith({
        ...baseFileUploadExemption,
        siteDetails: baseFileUploadExemption.siteDetails[0]
      })
      expect(result).toEqual({
        ...baseFileUploadExemption.siteDetails[0],
        isFileUpload: true,
        method: 'Upload a file with the coordinates of the site',
        fileType: 'KML',
        filename: 'test-site.kml'
      })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should process file upload site details successfully with Shapefile', () => {
      const shapefileExemption = {
        siteDetails: [
          {
            coordinatesType: 'file',
            fileUploadType: 'shapefile',
            uploadedFile: {
              filename: 'test-site.zip'
            }
          }
        ]
      }

      const mockFileUploadData = {
        method: 'Upload a file with the coordinates of the site',
        fileUploadType: 'Shapefile',
        uploadedFile: { filename: 'test-site.shp' },
        coordinates: [
          {
            type: 'Polygon',
            coordinates: [
              [
                [-0.1278, 51.5074],
                [-0.1285, 51.508],
                [-0.129, 51.507],
                [-0.1275, 51.5065]
              ]
            ]
          }
        ]
      }

      getFileUploadSummaryData.mockReturnValue(mockFileUploadData)

      const result = processFileUploadSiteDetails(
        shapefileExemption,
        mockExemptionId,
        mockRequest,
        0
      )

      expect(result).toEqual({
        ...shapefileExemption.siteDetails[0],
        isFileUpload: true,
        method: 'Upload a file with the coordinates of the site',
        fileType: 'Shapefile',
        filename: 'test-site.shp'
      })
    })

    test('should handle error from getFileUploadSummaryData and return fallback for KML', () => {
      const exemptionWithKml = {
        siteDetails: [
          {
            coordinatesType: 'file',
            fileUploadType: 'kml',
            uploadedFile: {
              filename: 'test-site.kml'
            }
          }
        ]
      }

      const mockError = new Error('Failed to parse file upload data')
      getFileUploadSummaryData.mockImplementation(() => {
        throw mockError
      })

      const result = processFileUploadSiteDetails(
        exemptionWithKml,
        mockExemptionId,
        mockRequest,
        0
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          error: 'Failed to parse file upload data',
          exemptionId: mockExemptionId
        },
        'Error getting file upload summary data'
      )

      expect(result).toEqual({
        ...exemptionWithKml.siteDetails[0],
        isFileUpload: true,
        method: 'Upload a file with the coordinates of the site',
        fileType: 'KML',
        filename: 'test-site.kml'
      })
    })

    test('should handle error from getFileUploadSummaryData and return fallback for Shapefile', () => {
      const exemptionWithShapefile = {
        siteDetails: [
          {
            coordinatesType: 'file',
            fileUploadType: 'shapefile',
            uploadedFile: {
              filename: 'test-site.zip'
            }
          }
        ]
      }

      getFileUploadSummaryData.mockImplementation(() => {
        throw new Error('Parse error')
      })

      const result = processFileUploadSiteDetails(
        exemptionWithShapefile,
        mockExemptionId,
        mockRequest,
        0
      )

      expect(result).toEqual({
        ...exemptionWithShapefile.siteDetails[0],
        isFileUpload: true,
        method: 'Upload a file with the coordinates of the site',
        fileType: 'Shapefile',
        filename: 'test-site.zip'
      })
    })

    test('should handle missing filename in uploadedFile', () => {
      const exemptionWithMissingFilename = {
        siteDetails: [
          {
            coordinatesType: 'file',
            fileUploadType: 'kml',
            uploadedFile: {}
          }
        ]
      }

      getFileUploadSummaryData.mockImplementation(() => {
        throw new Error('Missing filename')
      })

      const result = processFileUploadSiteDetails(
        exemptionWithMissingFilename,
        mockExemptionId,
        mockRequest,
        0
      )

      expect(result.filename).toBe('Unknown file')
    })
  })

  describe('processManualSiteDetails', () => {
    const baseManualExemption = {
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinateSystem: 'wgs84',
          coordinatesEntry: 'single',
          coordinates: {
            latitude: '51.5074',
            longitude: '-0.1278'
          },
          circleWidth: '100'
        }
      ]
    }

    beforeEach(() => {
      getCoordinateSystemText.mockReturnValue('WGS84 (latitude and longitude)')
      getCoordinateDisplayText.mockReturnValue('51.5074, -0.1278')
    })

    test('should process single circular site with WGS84 coordinates', () => {
      const result = processManualSiteDetails(baseManualExemption)

      expect(getCoordinateSystemText).toHaveBeenCalledWith('wgs84')
      expect(getCoordinateDisplayText).toHaveBeenCalledWith(
        baseManualExemption.siteDetails[0],
        'wgs84'
      )

      expect(result).toEqual({
        isFileUpload: false,
        coordinateSystemText: 'WGS84 (latitude and longitude)',
        reviewSummaryText:
          'Enter one set of coordinates and a width to create a circular site',
        coordinatesType: 'coordinates',
        coordinateSystem: 'wgs84',
        coordinatesEntry: 'single',
        coordinates: {
          latitude: '51.5074',
          longitude: '-0.1278'
        },
        circleWidth: '100',
        isPolygonSite: false,
        coordinateDisplayText: '51.5074, -0.1278',
        method: 'Enter the coordinates of the site manually'
      })
    })

    test('should process single circular site with OSGB36 coordinates', () => {
      const osgb36Exemption = {
        siteDetails: [
          {
            coordinatesType: 'coordinates',
            coordinateSystem: 'osgb36',
            coordinatesEntry: 'single',
            coordinates: {
              eastings: '425053',
              northings: '564180'
            },
            circleWidth: '250'
          }
        ]
      }

      getCoordinateSystemText.mockReturnValue('OSGB36 (eastings and northings)')
      getCoordinateDisplayText.mockReturnValue('425053, 564180')

      const result = processManualSiteDetails(osgb36Exemption)

      expect(result).toEqual({
        isFileUpload: false,
        coordinateSystemText: 'OSGB36 (eastings and northings)',
        reviewSummaryText:
          'Enter one set of coordinates and a width to create a circular site',
        coordinatesType: 'coordinates',
        coordinateSystem: 'osgb36',
        coordinatesEntry: 'single',
        coordinates: {
          eastings: '425053',
          northings: '564180'
        },
        circleWidth: '250',
        isPolygonSite: false,
        method: 'Enter the coordinates of the site manually',
        coordinateDisplayText: '425053, 564180'
      })
    })

    test('should process multiple polygon coordinates with WGS84', () => {
      const polygonExemption = {
        siteDetails: [
          {
            coordinatesType: 'coordinates',
            coordinateSystem: 'wgs84',
            coordinatesEntry: 'multiple',
            coordinates: [
              { latitude: '51.5074', longitude: '-0.1278' },
              { latitude: '51.5080', longitude: '-0.1285' },
              { latitude: '51.5070', longitude: '-0.1290' }
            ],
            circleWidth: null
          }
        ]
      }

      const mockPolygonData = [
        { label: 'Start and end points', value: '51.5074, -0.1278' },
        { label: 'Point 2', value: '51.5080, -0.1285' },
        { label: 'Point 3', value: '51.5070, -0.1290' }
      ]

      getPolygonCoordinatesDisplayData.mockReturnValue(mockPolygonData)

      const result = processManualSiteDetails(polygonExemption)

      expect(getPolygonCoordinatesDisplayData).toHaveBeenCalledWith(
        polygonExemption.siteDetails[0],
        'wgs84'
      )

      expect(result).toEqual({
        isFileUpload: false,
        coordinateSystemText: 'WGS84 (latitude and longitude)',
        reviewSummaryText:
          'Enter multiple sets of coordinates to mark the boundary of the site',
        method: 'Enter the coordinates of the site manually',
        coordinatesType: 'coordinates',
        coordinateSystem: 'wgs84',
        coordinatesEntry: 'multiple',
        coordinates: [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '51.5080', longitude: '-0.1285' },
          { latitude: '51.5070', longitude: '-0.1290' }
        ],
        circleWidth: null,
        isPolygonSite: true,
        polygonCoordinates: mockPolygonData
      })
    })

    test('should process multiple polygon coordinates with OSGB36', () => {
      const osgb36PolygonExemption = {
        siteDetails: [
          {
            coordinatesType: 'coordinates',
            coordinateSystem: 'osgb36',
            coordinatesEntry: 'multiple',
            coordinates: [
              { eastings: '425053', northings: '564180' },
              { eastings: '426000', northings: '565000' },
              { eastings: '427000', northings: '566000' }
            ],
            circleWidth: null
          }
        ]
      }

      const mockPolygonData = [
        { label: 'Start and end points', value: '425053, 564180' },
        { label: 'Point 2', value: '426000, 565000' },
        { label: 'Point 3', value: '427000, 566000' }
      ]

      getCoordinateSystemText.mockReturnValue('OSGB36 (eastings and northings)')
      getPolygonCoordinatesDisplayData.mockReturnValue(mockPolygonData)

      const result = processManualSiteDetails(osgb36PolygonExemption)

      expect(result.isPolygonSite).toBe(true)
      expect(result.polygonCoordinates).toEqual(mockPolygonData)
      expect(result.coordinateSystem).toBe('osgb36')
    })
  })

  describe('processSiteDetails', () => {
    const mockExemptionId = 'test-exemption-456'

    test('should return empty array when exemption has no siteDetails', () => {
      const exemptionWithoutSiteDetails = { siteDetails: [] }

      const result = processSiteDetails(
        exemptionWithoutSiteDetails,
        mockExemptionId,
        mockRequest
      )

      expect(result).toEqual([])
    })

    test('should return array with single file upload site', () => {
      const fileExemption = {
        multipleSiteDetails: {
          multipleSitesEnabled: false
        },
        siteDetails: [
          {
            coordinatesType: 'file',
            fileUploadType: 'kml',
            uploadedFile: {
              filename: 'test.kml'
            },
            activityDates: {
              start: '2025-01-01T00:00:00.000Z',
              end: '2025-01-31T00:00:00.000Z'
            },
            activityDescription: 'Test description'
          }
        ]
      }

      const mockFileUploadData = {
        method: 'Upload a file with the coordinates of the site',
        fileUploadType: 'KML',
        uploadedFile: { filename: 'test.kml' }
      }

      getFileUploadSummaryData.mockReturnValue(mockFileUploadData)

      const result = processSiteDetails(
        fileExemption,
        mockExemptionId,
        mockRequest
      )

      expect(result).toHaveLength(1)
      expect(result[0].isFileUpload).toBe(true)
      expect(result[0].fileType).toBe('KML')
      expect(result[0].filename).toBe('test.kml')
      expect(result[0].activityDates).toBe('1 January 2025 to 31 January 2025')
      expect(result[0].showActivityDates).toBe(true)
      expect(result[0].activityDescription).toBe('Test description')
      expect(result[0].showActivityDescription).toBe(true)
      expect(result[0].siteNumber).toBe(1)
    })

    test('should return array with single manual coordinate site', () => {
      const manualExemption = {
        multipleSiteDetails: {
          multipleSitesEnabled: false
        },
        siteDetails: [
          {
            coordinatesType: 'coordinates',
            coordinateSystem: 'wgs84',
            coordinatesEntry: 'single',
            coordinates: {
              latitude: '51.5074',
              longitude: '-0.1278'
            },
            circleWidth: '100',
            activityDates: {
              start: '2025-01-01T00:00:00.000Z',
              end: '2025-01-31T00:00:00.000Z'
            },
            activityDescription: 'Test description'
          }
        ]
      }

      getCoordinateSystemText.mockReturnValue('WGS84 (latitude and longitude)')
      getCoordinateDisplayText.mockReturnValue('51.5074, -0.1278')

      const result = processSiteDetails(
        manualExemption,
        mockExemptionId,
        mockRequest
      )

      expect(result).toHaveLength(1)
      expect(result[0].isFileUpload).toBe(false)
      expect(result[0].coordinateSystem).toBe('wgs84')
      expect(result[0].coordinatesEntry).toBe('single')
      expect(result[0].activityDates).toBe('1 January 2025 to 31 January 2025')
      expect(result[0].showActivityDates).toBe(true)
      expect(result[0].activityDescription).toBe('Test description')
      expect(result[0].showActivityDescription).toBe(true)
      expect(result[0].siteNumber).toBe(1)
    })

    test('should handle multiple sites with activity dates conditionally displayed', () => {
      const multiSiteExemption = {
        multipleSiteDetails: {
          multipleSitesEnabled: true,
          sameActivityDates: 'no',
          sameActivityDescription: 'yes'
        },
        siteDetails: [
          {
            coordinatesType: 'coordinates',
            coordinateSystem: 'wgs84',
            coordinatesEntry: 'single',
            coordinates: { latitude: '51.5074', longitude: '-0.1278' },
            circleWidth: '100',
            siteName: 'Site 1',
            activityDates: {
              start: '2025-01-01T00:00:00.000Z',
              end: '2025-01-31T00:00:00.000Z'
            },
            activityDescription: 'Shared description'
          },
          {
            coordinatesType: 'coordinates',
            coordinateSystem: 'wgs84',
            coordinatesEntry: 'single',
            coordinates: { latitude: '52.1234', longitude: '-1.5678' },
            circleWidth: '200',
            siteName: 'Site 2',
            activityDates: {
              start: '2025-02-01T00:00:00.000Z',
              end: '2025-02-28T00:00:00.000Z'
            },
            activityDescription: 'Shared description'
          }
        ]
      }

      getCoordinateSystemText.mockReturnValue('WGS84 (latitude and longitude)')
      getCoordinateDisplayText
        .mockReturnValueOnce('51.5074, -0.1278')
        .mockReturnValueOnce('52.1234, -1.5678')

      const result = processSiteDetails(
        multiSiteExemption,
        mockExemptionId,
        mockRequest
      )

      expect(result).toHaveLength(2)
      expect(result[0].siteName).toBe('Site 1')
      expect(result[0].activityDates).toBe('1 January 2025 to 31 January 2025')
      expect(result[0].showActivityDates).toBe(true)
      expect(result[0].activityDescription).toBe('Shared description')
      expect(result[0].showActivityDescription).toBe(false)
      expect(result[0].siteNumber).toBe(1)

      expect(result[1].siteName).toBe('Site 2')
      expect(result[1].activityDates).toBe(
        '1 February 2025 to 28 February 2025'
      )
      expect(result[1].showActivityDates).toBe(true)
      expect(result[1].activityDescription).toBe('Shared description')
      expect(result[1].showActivityDescription).toBe(false)
      expect(result[1].siteNumber).toBe(2)
    })

    test('should include site name only for multi-site journeys', () => {
      const multiSiteExemption = {
        multipleSiteDetails: {
          multipleSitesEnabled: true,
          sameActivityDates: 'yes',
          sameActivityDescription: 'yes'
        },
        siteDetails: [
          {
            coordinatesType: 'coordinates',
            coordinateSystem: 'wgs84',
            coordinatesEntry: 'single',
            coordinates: { latitude: '51.5074', longitude: '-0.1278' },
            circleWidth: '100',
            siteName: 'Site 1',
            activityDates: {
              start: '2025-01-01T00:00:00.000Z',
              end: '2025-01-31T00:00:00.000Z'
            },
            activityDescription: 'Test activity description'
          }
        ]
      }

      getCoordinateSystemText.mockReturnValue('WGS84 (latitude and longitude)')
      getCoordinateDisplayText.mockReturnValue('51.5074, -0.1278')

      const result = processSiteDetails(
        multiSiteExemption,
        mockExemptionId,
        mockRequest
      )

      expect(result[0].siteName).toBe('Site 1')
      expect(result[0].activityDates).toBe('1 January 2025 to 31 January 2025')
      expect(result[0].showActivityDates).toBe(false)
      expect(result[0].activityDescription).toBe('Test activity description')
      expect(result[0].showActivityDescription).toBe(false)
    })
  })

  describe('getReviewSummaryText utils', () => {
    test('getReviewSummaryText correctly returns text for site details circle width text', () => {
      expect(
        getReviewSummaryText({
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates'
        })
      ).toBe(
        'Enter one set of coordinates and a width to create a circular site'
      )
    })

    test('getReviewSummaryText correctly returns blank otherwise', () => {
      expect(getReviewSummaryText({})).toBe('')
    })
  })
})
