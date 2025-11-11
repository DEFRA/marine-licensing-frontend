import { beforeEach, vi } from 'vitest'
import Boom from '@hapi/boom'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  buildManualCoordinateSummaryData,
  getCoordinateDisplayText,
  getCoordinateSystemText,
  getFileUploadBackLink,
  getFileUploadSummaryData,
  getPolygonCoordinatesDisplayData,
  getSiteDetailsBackLink,
  handleSubmissionError,
  hasIncompleteFields,
  renderFileUploadReview,
  renderManualCoordinateReview
} from '#src/server/exemption/site-details/review-site-details/utils.js'
import {
  createMockRequest,
  mockExemption
} from '#src/server/test-helpers/mocks.js'

import { getCoordinateSystem } from '#src/server/common/helpers/coordinate-utils.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

// Mock the getCoordinateSystem helper
vi.mock('#src/server/common/helpers/coordinate-utils.js', () => ({
  getCoordinateSystem: vi.fn(),
  extractCoordinatesFromGeoJSON: vi.fn()
}))

describe('siteDetails utils', () => {
  const mockRequest = createMockRequest()

  describe('getSiteDetailsBackLink util', () => {
    test('getSiteDetailsBackLink correctly returns task list when coming from the task list', () => {
      expect(getSiteDetailsBackLink(`http://hostname${routes.TASK_LIST}`)).toBe(
        routes.TASK_LIST
      )
    })

    test('getSiteDetailsBackLink correctly returns page when coming from circle width page', () => {
      expect(
        getSiteDetailsBackLink(`http://hostname${routes.WIDTH_OF_SITE}`)
      ).toBe(routes.WIDTH_OF_SITE)
    })

    test('getSiteDetailsBackLink correctly returns fallback option', () => {
      expect(getSiteDetailsBackLink(undefined)).toBe(routes.TASK_LIST)
    })

    test('getSiteDetailsBackLink correctly returns to check your answers', () => {
      expect(getSiteDetailsBackLink('any page', 'multiple', true)).toBe(
        routes.CHECK_YOUR_ANSWERS
      )
    })
  })

  describe('getFileUploadSummaryData util', () => {
    test('getFileUploadSummaryData correctly parses coordinates from geoJSON for KML', () => {
      const exemption = {
        siteDetails: {
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test-site.kml'
          },
          geoJSON: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [51.5074, -0.1278]
                }
              },
              {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [0, 0],
                      [1, 0],
                      [1, 1],
                      [0, 1],
                      [0, 0]
                    ]
                  ]
                }
              }
            ]
          }
        }
      }

      const result = getFileUploadSummaryData(exemption)

      expect(result).toEqual({
        coordinates: [
          {
            type: 'Point',
            coordinates: [51.5074, -0.1278]
          },
          {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
                [0, 0]
              ]
            ]
          }
        ],
        geoJSON: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [51.5074, -0.1278]
              }
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0]
                  ]
                ]
              }
            }
          ]
        }
      })
    })

    test('getFileUploadSummaryData correctly parses coordinates from geoJSON for Shapefile', () => {
      const exemption = {
        siteDetails: {
          fileUploadType: 'shapefile',
          uploadedFile: {
            filename: 'test-site.shp'
          },
          geoJSON: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [1, 1],
                    [2, 2]
                  ]
                }
              }
            ]
          }
        }
      }

      const result = getFileUploadSummaryData(exemption)

      expect(result).toEqual({
        coordinates: [
          {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
              [2, 2]
            ]
          }
        ],
        geoJSON: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [0, 0],
                  [1, 1],
                  [2, 2]
                ]
              }
            }
          ]
        }
      })
    })

    test('getFileUploadSummaryData handles empty or missing geoJSON', () => {
      const exemption = {
        siteDetails: {
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test-site.kml'
          },
          geoJSON: {}
        }
      }

      const result = getFileUploadSummaryData(exemption)

      expect(result).toEqual({
        coordinates: [],
        geoJSON: {}
      })
    })

    test('getFileUploadSummaryData handles missing site details', () => {
      const exemption = {}

      const result = getFileUploadSummaryData(exemption)

      expect(result).toEqual({
        coordinates: [],
        geoJSON: {}
      })
    })

    test('getFileUploadSummaryData handles invalid file type', () => {
      const exemption = {
        siteDetails: [
          {
            fileUploadType: 'invalid',
            uploadedFile: {
              filename: 'test-site.xyz'
            },
            geoJSON: {
              type: 'FeatureCollection',
              features: []
            }
          }
        ]
      }

      const result = getFileUploadSummaryData(exemption)

      expect(result).toEqual({
        coordinates: [],
        geoJSON: {}
      })
    })
  })

  describe('getCoordinateSystemText utils', () => {
    test('getCoordinateSystemText correctly returns text for OSGB36', () => {
      expect(getCoordinateSystemText(COORDINATE_SYSTEMS.OSGB36)).toBe(
        'British National Grid (OSGB36)\nEastings and Northings'
      )
    })

    test('getCoordinateSystemText correctly returns text for WGS84', () => {
      expect(getCoordinateSystemText(COORDINATE_SYSTEMS.WGS84)).toBe(
        'WGS84 (World Geodetic System 1984)\nLatitude and longitude'
      )
    })

    test('getReviewSummaryText correctly returns blank otherwise', () => {
      expect(getCoordinateSystemText()).toBe('')
    })
  })

  describe('getCoordinateDisplayText utils', () => {
    test('getCoordinateDisplayText correctly returns text for WGS84', () => {
      expect(
        getCoordinateDisplayText(
          { coordinates: mockExemption.siteDetails[0].coordinates },
          COORDINATE_SYSTEMS.WGS84
        )
      ).toBe(
        `${mockExemption.siteDetails[0].coordinates.latitude ?? ''}, ${mockExemption.siteDetails[0].coordinates.longitude ?? ''}`
      )
    })

    test('getCoordinateDisplayText correctly returns text for OSGB36', () => {
      expect(
        getCoordinateDisplayText(
          { coordinates: { eastings: '425053', northings: '564180' } },
          COORDINATE_SYSTEMS.OSGB36
        )
      ).toBe(`425053, 564180`)
    })

    test('getCoordinateDisplayText correctly returns blank when site details blank', () => {
      expect(getCoordinateDisplayText({}, COORDINATE_SYSTEMS.OSGB36)).toBe('')
    })

    test('getCoordinateDisplayText correctly returns blank otherwise', () => {
      expect(getCoordinateDisplayText({})).toBe('')
    })
  })

  describe('getPolygonCoordinatesDisplayData util', () => {
    test('getPolygonCoordinatesDisplayData correctly formats valid WGS84 coordinates', () => {
      const siteDetails = {
        coordinates: [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '51.5084', longitude: '-0.1288' },
          { latitude: '51.5094', longitude: '-0.1298' }
        ]
      }
      const coordinateSystem = COORDINATE_SYSTEMS.WGS84

      const result = getPolygonCoordinatesDisplayData(
        siteDetails,
        coordinateSystem
      )

      expect(result).toEqual([
        { label: 'Start and end points', value: '51.5074, -0.1278' },
        { label: 'Point 2', value: '51.5084, -0.1288' },
        { label: 'Point 3', value: '51.5094, -0.1298' }
      ])
    })

    test('getPolygonCoordinatesDisplayData correctly formats valid OSGB36 coordinates', () => {
      const siteDetails = {
        coordinates: [
          { eastings: '425053', northings: '564180' },
          { eastings: '425063', northings: '564190' }
        ]
      }
      const coordinateSystem = COORDINATE_SYSTEMS.OSGB36

      const result = getPolygonCoordinatesDisplayData(
        siteDetails,
        coordinateSystem
      )

      expect(result).toEqual([
        { label: 'Start and end points', value: '425053, 564180' },
        { label: 'Point 2', value: '425063, 564190' }
      ])
    })

    test('getPolygonCoordinatesDisplayData filters out falsy coordinates', () => {
      const siteDetails = {
        coordinates: [
          { latitude: '51.5074', longitude: '-0.1278' },
          null, // This should be filtered out
          undefined, // This should be filtered out
          { latitude: '51.5084', longitude: '-0.1288' },
          '', // This should be filtered out
          { latitude: '51.5094', longitude: '-0.1298' }
        ]
      }
      const coordinateSystem = COORDINATE_SYSTEMS.WGS84

      const result = getPolygonCoordinatesDisplayData(
        siteDetails,
        coordinateSystem
      )

      expect(result).toEqual([
        { label: 'Start and end points', value: '51.5074, -0.1278' },
        { label: 'Point 2', value: '51.5084, -0.1288' },
        { label: 'Point 3', value: '51.5094, -0.1298' }
      ])
    })

    test('getPolygonCoordinatesDisplayData filters out incomplete coordinates for WGS84', () => {
      const siteDetails = {
        coordinates: [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '51.5084' }, // Missing longitude
          { longitude: '-0.1288' }, // Missing latitude
          { latitude: '51.5094', longitude: '-0.1298' }
        ]
      }
      const coordinateSystem = COORDINATE_SYSTEMS.WGS84

      const result = getPolygonCoordinatesDisplayData(
        siteDetails,
        coordinateSystem
      )

      expect(result).toEqual([
        { label: 'Start and end points', value: '51.5074, -0.1278' },
        { label: 'Point 2', value: '51.5094, -0.1298' }
      ])
    })

    test('getPolygonCoordinatesDisplayData filters out incomplete coordinates for OSGB36', () => {
      const siteDetails = {
        coordinates: [
          { eastings: '425053', northings: '564180' },
          { eastings: '425063' }, // Missing northings
          { northings: '564190' }, // Missing eastings
          { eastings: '425073', northings: '564200' }
        ]
      }
      const coordinateSystem = COORDINATE_SYSTEMS.OSGB36

      const result = getPolygonCoordinatesDisplayData(
        siteDetails,
        coordinateSystem
      )

      expect(result).toEqual([
        { label: 'Start and end points', value: '425053, 564180' },
        { label: 'Point 2', value: '425073, 564200' }
      ])
    })

    test('getPolygonCoordinatesDisplayData returns empty array when site details invalid', () => {
      expect(
        getPolygonCoordinatesDisplayData(null, COORDINATE_SYSTEMS.WGS84)
      ).toEqual([])
      expect(
        getPolygonCoordinatesDisplayData({}, COORDINATE_SYSTEMS.WGS84)
      ).toEqual([])
      expect(
        getPolygonCoordinatesDisplayData(
          { coordinates: null },
          COORDINATE_SYSTEMS.WGS84
        )
      ).toEqual([])
    })

    test('getPolygonCoordinatesDisplayData returns empty array when coordinate system invalid', () => {
      const siteDetails = {
        coordinates: [{ latitude: '51.5074', longitude: '-0.1278' }]
      }

      expect(getPolygonCoordinatesDisplayData(siteDetails, null)).toEqual([])
      expect(getPolygonCoordinatesDisplayData(siteDetails, undefined)).toEqual(
        []
      )
    })
  })

  describe('getFileUploadBackLink util', () => {
    test('getFileUploadBackLink correctly returns task list when coming from the task list', () => {
      expect(getFileUploadBackLink(`http://hostname${routes.TASK_LIST}`)).toBe(
        routes.TASK_LIST
      )
    })

    test('getFileUploadBackLink correctly returns file upload route', () => {
      expect(
        getFileUploadBackLink(`http://hostname${routes.ACTIVITY_DESCRIPTION}`)
      ).toBe(routes.ACTIVITY_DESCRIPTION)
    })

    test('getFileUploadBackLink correctly returns file upload as fallback', () => {
      expect(getFileUploadBackLink(undefined)).toBe(routes.FILE_UPLOAD)
    })

    test('getFileUploadBackLink correctly handles invalid URLs', () => {
      expect(getFileUploadBackLink('invalid-url')).toBe(routes.FILE_UPLOAD)
    })

    test('getFileUploadBackLink correctly handles check your answers redirect', () => {
      expect(getFileUploadBackLink('any page', true)).toBe(
        routes.CHECK_YOUR_ANSWERS
      )
    })
  })

  describe('buildManualCoordinateSummaryData util', () => {
    test('buildManualCoordinateSummaryData correctly builds summary data for single site with all fields', () => {
      const siteDetails = [
        {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z'
          },
          activityDescription: 'Test activity description',
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: {
            latitude: '51.5074',
            longitude: '-0.1278'
          },
          circleWidth: '1',
          siteName: 'Test Site 1'
        }
      ]
      const coordinateSystem = COORDINATE_SYSTEMS.WGS84

      const result = buildManualCoordinateSummaryData(
        siteDetails,
        {},
        coordinateSystem
      )

      expect(result).toEqual([
        {
          activityDates: '1 January 2025 to 1 January 2025',
          activityDescription: 'Test activity description',
          method:
            'Enter one set of coordinates and a width to create a circular site',
          showActivityDates: true,
          showActivityDescription: true,
          siteName: 'Test Site 1',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
          coordinates: '51.5074, -0.1278',
          width: '1 metre',
          siteNumber: 1,
          siteDetailsData: expect.stringContaining(
            '"coordinatesType":"coordinates"'
          )
        }
      ])
    })

    test('buildManualCoordinateSummaryData correctly builds summary data for multiple sites with all fields', () => {
      const siteDetails = [
        {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z'
          },
          activityDescription: 'Test activity description',
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: {
            latitude: '51.5074',
            longitude: '-0.1278'
          },
          circleWidth: '1',
          siteName: 'Test Site 2'
        }
      ]

      const multipleSiteDetails = {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes',
        sameActivityDescription: 'yes'
      }

      const result = buildManualCoordinateSummaryData(
        siteDetails,
        multipleSiteDetails,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(result).toEqual([
        {
          activityDates: '',
          activityDescription: '',
          method:
            'Enter one set of coordinates and a width to create a circular site',
          showActivityDates: false,
          showActivityDescription: false,
          siteName: 'Test Site 2',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
          coordinates: '51.5074, -0.1278',
          width: '1 metre',
          siteNumber: 1,
          siteDetailsData: expect.stringContaining(
            '"coordinatesType":"coordinates"'
          )
        }
      ])
    })

    test('buildManualCoordinateSummaryData correctly handles OSGB36 coordinates', () => {
      const siteDetails = [
        {
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: {
            eastings: '425053',
            northings: '564180'
          },
          circleWidth: '200',
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z'
          },
          activityDescription: 'Test activity description',
          siteName: 'Test Site 3'
        }
      ]

      const result = buildManualCoordinateSummaryData(siteDetails, {})

      expect(result).toEqual([
        {
          activityDates: '1 January 2025 to 1 January 2025',
          activityDescription: 'Test activity description',
          method:
            'Enter one set of coordinates and a width to create a circular site',
          showActivityDates: true,
          showActivityDescription: true,
          siteName: 'Test Site 3',
          coordinateSystem:
            'British National Grid (OSGB36)\nEastings and Northings',
          coordinates: '425053, 564180',
          width: '200 metres',
          siteNumber: 1,
          siteDetailsData: expect.stringContaining(
            '"coordinatesType":"coordinates"'
          )
        }
      ])
    })

    test('buildManualCoordinateSummaryData correctly handles missing data', () => {
      const siteDetails = [
        {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: {
            latitude: '51.5074',
            longitude: '-0.1278'
          },
          siteName: 'Test Site 4'
        }
      ]

      const result = buildManualCoordinateSummaryData(
        siteDetails,
        {
          multipleSitesEnabled: true,
          sameActivityDates: 'no'
        },
        COORDINATE_SYSTEMS.WGS84
      )

      expect(result[0].activityDates).toBe('')
      expect(result[0].activityDescription).toBe('')
      expect(result[0].width).toBe('')
    })
  })

  describe('renderFileUploadReview util', () => {
    const mockH = {
      view: vi.fn()
    }

    test('renderFileUploadReview renders correct view with data', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: false },
        projectName: 'Test Project'
      }
      const siteDetails = [
        {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test-site.kml'
          },
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
          siteName: 'File Upload Site 1'
        }
      ]
      const previousPage = `http://hostname${routes.FILE_UPLOAD}`
      const reviewSiteDetailsPageData = {
        pageTitle: 'Review site details'
      }

      renderFileUploadReview(mockH, {
        exemption,
        siteDetails,
        previousPage,
        reviewSiteDetailsPageData
      })

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/review-site-details/file-upload-review',
        expect.objectContaining({
          pageTitle: 'Review site details',
          backLink: routes.FILE_UPLOAD,
          projectName: 'Test Project',
          summaryData: expect.arrayContaining([
            expect.objectContaining({
              coordinates: [
                {
                  type: 'Point',
                  coordinates: [51.5074, -0.1278]
                }
              ]
            })
          ]),
          multipleSiteDetailsData: expect.objectContaining({
            method: 'Upload a file with the coordinates of the site',
            multipleSiteDetails: 'No',
            sameActivityDates: 'No',
            sameActivityDescription: 'No',
            fileType: 'KML',
            filename: 'test-site.kml'
          })
        })
      )
    })
  })

  describe('renderManualCoordinateReview util', () => {
    const mockH = {
      view: vi.fn()
    }

    beforeEach(() => {
      // Mock the getCoordinateSystem helper
      getCoordinateSystem.mockReturnValue({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })
    })

    test('renderManualCoordinateReview renders correct view with data', () => {
      const siteDetails = [
        {
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z'
          },
          activityDescription: 'Test activity description',
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: {
            latitude: '51.5074',
            longitude: '-0.1278'
          },
          circleWidth: '100',
          siteName: 'Manual Coordinate Site 1'
        }
      ]
      const previousPage = `http://hostname${routes.WIDTH_OF_SITE}`
      const reviewSiteDetailsPageData = {
        pageTitle: 'Review site details'
      }

      const exemption = {
        projectName: 'Test Project',
        multipleSiteDetails: {},
        siteDetails
      }

      renderManualCoordinateReview(mockH, {
        exemption,
        siteDetails,
        previousPage,
        reviewSiteDetailsPageData
      })

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/review-site-details/index',
        expect.objectContaining({
          pageTitle: 'Review site details',
          backLink: routes.WIDTH_OF_SITE,
          isMultiSiteJourney: false,
          projectName: 'Test Project',
          summaryData: expect.arrayContaining([
            expect.objectContaining({
              activityDates: '1 January 2025 to 1 January 2025',
              activityDescription: 'Test activity description',
              method:
                'Enter one set of coordinates and a width to create a circular site',
              showActivityDates: true,
              showActivityDescription: true,
              siteName: 'Manual Coordinate Site 1'
            })
          ]),
          multipleSiteDetailsData: expect.objectContaining({
            method: 'Enter the coordinates of the site manually',
            multipleSiteDetails: 'No',
            sameActivityDates: 'No',
            sameActivityDescription: 'No'
          })
        })
      )
    })
  })

  describe('handleSubmissionError util', () => {
    test('handleSubmissionError logs error and returns Boom error', () => {
      const error = new Error('Test error message')
      const exemptionId = 'test-exemption-id'
      const coordinatesType = 'coordinates'

      const result = handleSubmissionError(
        mockRequest,
        error,
        exemptionId,
        coordinatesType
      )

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        {
          error: 'Test error message',
          exemptionId: 'test-exemption-id',
          coordinatesType: 'coordinates'
        },
        'Error submitting site review'
      )

      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(400)
      expect(result.message).toBe('Error submitting site review')
    })
  })

  describe('hasIncompleteFields util', () => {
    test('should return false for null, undefined, or empty inputs', () => {
      expect(hasIncompleteFields(null, {})).toBe(false)
      expect(hasIncompleteFields(undefined, {})).toBe(false)
      expect(hasIncompleteFields([], {})).toBe(false)
      expect(hasIncompleteFields([{ siteName: 'Test' }], null)).toBe(false)
    })

    test('should return true when siteName is missing or empty in multi-site journey', () => {
      const multipleSiteDetails = { multipleSitesEnabled: true }

      expect(
        hasIncompleteFields(
          [{ activityDates: { start: '2025-01-01', end: '2025-01-02' } }],
          multipleSiteDetails
        )
      ).toBe(true)

      expect(hasIncompleteFields([{ siteName: '' }], multipleSiteDetails)).toBe(
        true
      )

      expect(
        hasIncompleteFields([{ siteName: '   ' }], multipleSiteDetails)
      ).toBe(true)
    })

    test('should return true when activity dates are missing and sameActivityDates is no', () => {
      const multipleSiteDetails = {
        multipleSitesEnabled: true,
        sameActivityDates: 'no'
      }

      expect(
        hasIncompleteFields(
          [{ siteName: 'Test Site', activityDescription: 'Test' }],
          multipleSiteDetails
        )
      ).toBe(true)

      expect(
        hasIncompleteFields(
          [
            {
              siteName: 'Test Site',
              activityDates: { start: '2025-01-01' }
            }
          ],
          multipleSiteDetails
        )
      ).toBe(true)
    })

    test('should return true when activity description is missing and sameActivityDescription is no', () => {
      const multipleSiteDetails = {
        multipleSitesEnabled: true,
        sameActivityDescription: 'no'
      }

      expect(
        hasIncompleteFields(
          [
            {
              siteName: 'Test Site',
              activityDates: { start: '2025-01-01', end: '2025-01-02' }
            }
          ],
          multipleSiteDetails
        )
      ).toBe(true)

      expect(
        hasIncompleteFields(
          [
            {
              siteName: 'Test Site',
              activityDescription: '   '
            }
          ],
          multipleSiteDetails
        )
      ).toBe(true)
    })

    test('should return false when all required fields are present', () => {
      expect(
        hasIncompleteFields(
          [
            {
              siteName: 'Site 1',
              activityDates: { start: '2025-01-01', end: '2025-01-02' },
              activityDescription: 'Description 1'
            },
            {
              siteName: 'Site 2',
              activityDates: { start: '2025-01-03', end: '2025-01-04' },
              activityDescription: 'Description 2'
            }
          ],
          {
            multipleSitesEnabled: true,
            sameActivityDates: 'no',
            sameActivityDescription: 'no'
          }
        )
      ).toBe(false)
    })

    test('should return false when sameActivityDates or sameActivityDescription is yes', () => {
      expect(
        hasIncompleteFields([{ siteName: 'Test Site' }], {
          multipleSitesEnabled: true,
          sameActivityDates: 'yes',
          sameActivityDescription: 'yes'
        })
      ).toBe(false)
    })

    test('should return true when any site in multiple sites is incomplete', () => {
      expect(
        hasIncompleteFields(
          [
            {
              siteName: 'Site 1',
              activityDates: { start: '2025-01-01', end: '2025-01-02' },
              activityDescription: 'Description 1'
            },
            {
              siteName: '',
              activityDates: { start: '2025-01-03', end: '2025-01-04' },
              activityDescription: 'Description 2'
            }
          ],
          { multipleSitesEnabled: true }
        )
      ).toBe(true)
    })
  })
})
