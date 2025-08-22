import {
  processFileUploadSiteDetails,
  processManualSiteDetails,
  processSiteDetails,
  errorMessages
} from './exemption-site-details.js'

import {
  getCoordinateSystemText,
  getCoordinateDisplayText,
  getReviewSummaryText,
  getFileUploadSummaryData,
  getPolygonCoordinatesDisplayData
} from '~/src/server/exemption/site-details/review-site-details/utils.js'

jest.mock(
  '~/src/server/exemption/site-details/review-site-details/utils.js',
  () => ({
    getCoordinateSystemText: jest.fn(),
    getCoordinateDisplayText: jest.fn(),
    getReviewSummaryText: jest.fn(),
    getFileUploadSummaryData: jest.fn(),
    getPolygonCoordinatesDisplayData: jest.fn()
  })
)

describe('exemption-site-details helper', () => {
  let mockRequest
  let mockLogger

  beforeEach(() => {
    mockLogger = {
      error: jest.fn()
    }
    mockRequest = {
      logger: mockLogger
    }

    jest.resetAllMocks()
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
      siteDetails: {
        coordinatesType: 'file',
        fileUploadType: 'kml',
        uploadedFile: {
          filename: 'test-site.kml'
        }
      }
    }

    test('should process file upload site details successfully with KML file', () => {
      const mockFileUploadData = {
        method: 'Upload a file with the coordinates of the site',
        fileType: 'KML',
        filename: 'test-site.kml',
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
        mockRequest
      )

      expect(getFileUploadSummaryData).toHaveBeenCalledWith(
        baseFileUploadExemption
      )
      expect(result).toEqual({
        ...baseFileUploadExemption.siteDetails,
        isFileUpload: true,
        method: 'Upload a file with the coordinates of the site',
        fileType: 'KML',
        filename: 'test-site.kml'
      })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should process file upload site details successfully with Shapefile', () => {
      const shapefileExemption = {
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'shapefile',
          uploadedFile: {
            filename: 'test-site.zip'
          }
        }
      }

      const mockFileUploadData = {
        method: 'Upload a file with the coordinates of the site',
        fileType: 'Shapefile',
        filename: 'test-site.shp',
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
        mockRequest
      )

      expect(result).toEqual({
        ...shapefileExemption.siteDetails,
        isFileUpload: true,
        method: 'Upload a file with the coordinates of the site',
        fileType: 'Shapefile',
        filename: 'test-site.shp'
      })
    })

    test('should handle error from getFileUploadSummaryData and return fallback for KML', () => {
      const exemptionWithKml = {
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test-site.kml'
          }
        }
      }

      const mockError = new Error('Failed to parse file upload data')
      getFileUploadSummaryData.mockImplementation(() => {
        throw mockError
      })

      const result = processFileUploadSiteDetails(
        exemptionWithKml,
        mockExemptionId,
        mockRequest
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          error: 'Failed to parse file upload data',
          exemptionId: mockExemptionId
        },
        'Error getting file upload summary data'
      )

      expect(result).toEqual({
        ...exemptionWithKml.siteDetails,
        isFileUpload: true,
        method: 'Upload a file with the coordinates of the site',
        fileType: 'KML',
        filename: 'test-site.kml'
      })
    })

    test('should handle error from getFileUploadSummaryData and return fallback for Shapefile', () => {
      const exemptionWithShapefile = {
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'shapefile',
          uploadedFile: {
            filename: 'test-site.zip'
          }
        }
      }

      getFileUploadSummaryData.mockImplementation(() => {
        throw new Error('Parse error')
      })

      const result = processFileUploadSiteDetails(
        exemptionWithShapefile,
        mockExemptionId,
        mockRequest
      )

      expect(result).toEqual({
        ...exemptionWithShapefile.siteDetails,
        isFileUpload: true,
        method: 'Upload a file with the coordinates of the site',
        fileType: 'Shapefile',
        filename: 'test-site.zip'
      })
    })

    test('should handle missing filename in uploadedFile', () => {
      const exemptionWithMissingFilename = {
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {}
        }
      }

      getFileUploadSummaryData.mockImplementation(() => {
        throw new Error('Missing filename')
      })

      const result = processFileUploadSiteDetails(
        exemptionWithMissingFilename,
        mockExemptionId,
        mockRequest
      )

      expect(result.filename).toBe('Unknown file')
    })
  })

  describe('processManualSiteDetails', () => {
    const baseManualExemption = {
      siteDetails: {
        coordinatesType: 'coordinates',
        coordinateSystem: 'wgs84',
        coordinatesEntry: 'single',
        coordinates: {
          latitude: '51.5074',
          longitude: '-0.1278'
        },
        circleWidth: '100'
      }
    }

    beforeEach(() => {
      getCoordinateSystemText.mockReturnValue('WGS84 (latitude and longitude)')
      getReviewSummaryText.mockReturnValue('Single circular site')
      getCoordinateDisplayText.mockReturnValue('51.5074, -0.1278')
    })

    test('should process single circular site with WGS84 coordinates', () => {
      const result = processManualSiteDetails(baseManualExemption)

      expect(getCoordinateSystemText).toHaveBeenCalledWith('wgs84')
      expect(getReviewSummaryText).toHaveBeenCalledWith(
        baseManualExemption.siteDetails
      )
      expect(getCoordinateDisplayText).toHaveBeenCalledWith(
        baseManualExemption.siteDetails,
        'wgs84'
      )

      expect(result).toEqual({
        isFileUpload: false,
        coordinateSystemText: 'WGS84 (latitude and longitude)',
        reviewSummaryText: 'Single circular site',
        coordinatesType: 'coordinates',
        coordinateSystem: 'wgs84',
        coordinatesEntry: 'single',
        coordinates: {
          latitude: '51.5074',
          longitude: '-0.1278'
        },
        circleWidth: '100',
        isPolygonSite: false,
        coordinateDisplayText: '51.5074, -0.1278'
      })
    })

    test('should process single circular site with OSGB36 coordinates', () => {
      const osgb36Exemption = {
        siteDetails: {
          coordinatesType: 'coordinates',
          coordinateSystem: 'osgb36',
          coordinatesEntry: 'single',
          coordinates: {
            eastings: '425053',
            northings: '564180'
          },
          circleWidth: '250'
        }
      }

      getCoordinateSystemText.mockReturnValue('OSGB36 (eastings and northings)')
      getCoordinateDisplayText.mockReturnValue('425053, 564180')

      const result = processManualSiteDetails(osgb36Exemption)

      expect(result).toEqual({
        isFileUpload: false,
        coordinateSystemText: 'OSGB36 (eastings and northings)',
        reviewSummaryText: 'Single circular site',
        coordinatesType: 'coordinates',
        coordinateSystem: 'osgb36',
        coordinatesEntry: 'single',
        coordinates: {
          eastings: '425053',
          northings: '564180'
        },
        circleWidth: '250',
        isPolygonSite: false,
        coordinateDisplayText: '425053, 564180'
      })
    })

    test('should process multiple polygon coordinates with WGS84', () => {
      const polygonExemption = {
        siteDetails: {
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
      }

      const mockPolygonData = [
        { label: 'Start and end points', value: '51.5074, -0.1278' },
        { label: 'Point 2', value: '51.5080, -0.1285' },
        { label: 'Point 3', value: '51.5070, -0.1290' }
      ]

      getReviewSummaryText.mockReturnValue('Multiple polygon site')
      getPolygonCoordinatesDisplayData.mockReturnValue(mockPolygonData)

      const result = processManualSiteDetails(polygonExemption)

      expect(getPolygonCoordinatesDisplayData).toHaveBeenCalledWith(
        polygonExemption.siteDetails,
        'wgs84'
      )

      expect(result).toEqual({
        isFileUpload: false,
        coordinateSystemText: 'WGS84 (latitude and longitude)',
        reviewSummaryText: 'Multiple polygon site',
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
        siteDetails: {
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
      }

      const mockPolygonData = [
        { label: 'Start and end points', value: '425053, 564180' },
        { label: 'Point 2', value: '426000, 565000' },
        { label: 'Point 3', value: '427000, 566000' }
      ]

      getCoordinateSystemText.mockReturnValue('OSGB36 (eastings and northings)')
      getReviewSummaryText.mockReturnValue('Multiple polygon site')
      getPolygonCoordinatesDisplayData.mockReturnValue(mockPolygonData)

      const result = processManualSiteDetails(osgb36PolygonExemption)

      expect(result.isPolygonSite).toBe(true)
      expect(result.polygonCoordinates).toEqual(mockPolygonData)
      expect(result.coordinateSystem).toBe('osgb36')
    })
  })

  describe('processSiteDetails', () => {
    const mockExemptionId = 'test-exemption-456'

    test('should return null when exemption has no siteDetails', () => {
      const exemptionWithoutSiteDetails = {}

      const result = processSiteDetails(
        exemptionWithoutSiteDetails,
        mockExemptionId,
        mockRequest
      )

      expect(result).toBeNull()
    })

    test('should route to processFileUploadSiteDetails for file coordinates', () => {
      const fileExemption = {
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test.kml'
          }
        }
      }

      const mockFileUploadData = {
        method: 'Upload a file with the coordinates of the site',
        fileType: 'KML',
        filename: 'test.kml'
      }

      getFileUploadSummaryData.mockReturnValue(mockFileUploadData)

      const result = processSiteDetails(
        fileExemption,
        mockExemptionId,
        mockRequest
      )

      expect(result.isFileUpload).toBe(true)
      expect(result.fileType).toBe('KML')
      expect(result.filename).toBe('test.kml')
    })

    test('should route to processManualSiteDetails for manual coordinates', () => {
      const manualExemption = {
        siteDetails: {
          coordinatesType: 'coordinates',
          coordinateSystem: 'wgs84',
          coordinatesEntry: 'single',
          coordinates: {
            latitude: '51.5074',
            longitude: '-0.1278'
          },
          circleWidth: '100'
        }
      }

      getCoordinateSystemText.mockReturnValue('WGS84 (latitude and longitude)')
      getReviewSummaryText.mockReturnValue('Single circular site')
      getCoordinateDisplayText.mockReturnValue('51.5074, -0.1278')

      const result = processSiteDetails(
        manualExemption,
        mockExemptionId,
        mockRequest
      )

      expect(result.isFileUpload).toBe(false)
      expect(result.coordinateSystem).toBe('wgs84')
      expect(result.coordinatesEntry).toBe('single')
    })

    test('should default to processManualSiteDetails for unknown coordinatesType', () => {
      const unknownTypeExemption = {
        siteDetails: {
          coordinatesType: 'unknown',
          coordinateSystem: 'wgs84',
          coordinatesEntry: 'single',
          coordinates: {
            latitude: '51.5074',
            longitude: '-0.1278'
          },
          circleWidth: '100'
        }
      }

      getCoordinateSystemText.mockReturnValue('WGS84 (latitude and longitude)')
      getReviewSummaryText.mockReturnValue('Single circular site')
      getCoordinateDisplayText.mockReturnValue('51.5074, -0.1278')

      const result = processSiteDetails(
        unknownTypeExemption,
        mockExemptionId,
        mockRequest
      )

      expect(result.isFileUpload).toBe(false)
      expect(result.coordinatesType).toBe('coordinates')
    })
  })
})
