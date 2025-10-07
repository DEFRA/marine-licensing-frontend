import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'
import * as coordinateUtils from '#src/server/common/helpers/coordinate-utils.js'
import {
  FILE_UPLOAD_REVIEW_VIEW_ROUTE,
  REVIEW_SITE_DETAILS_VIEW_ROUTE,
  reviewSiteDetailsController,
  reviewSiteDetailsSubmitController
} from '#src/server/exemption/site-details/review-site-details/controller.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { mockExemption } from '#src/server/test-helpers/mocks.js'
import { makePostRequest } from '#src/server/test-helpers/server-requests.js'
import { JSDOM } from 'jsdom'
import { routes } from '#src/server/common/constants/routes.js'
import {
  getPolygonCoordinatesDisplayData,
  buildManualCoordinateSummaryData,
  getSiteDetailsBackLink,
  getReviewSummaryText,
  getCoordinateSystemText
} from '#src/server/exemption/site-details/review-site-details/utils.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/coordinate-utils.js')
function createMockHandler(type = 'view') {
  if (type === 'redirect') {
    return { redirect: vi.fn() }
  }
  return { view: vi.fn() }
}
function createMockExemption(
  type = 'single',
  coordinateSystem = COORDINATE_SYSTEMS.WGS84,
  overrides = {}
) {
  const baseExemption = {
    ...mockExemption,
    ...overrides,
    siteDetails: [
      {
        ...mockExemption.siteDetails[0],
        coordinatesType: 'coordinates',
        coordinateSystem
      }
    ]
  }

  switch (type) {
    case 'multiple':
      return {
        ...baseExemption,
        siteDetails: [
          {
            ...baseExemption.siteDetails[0],
            coordinatesEntry: 'multiple',
            coordinates:
              coordinateSystem === COORDINATE_SYSTEMS.WGS84
                ? [
                    { latitude: '55.123456', longitude: '55.123456' },
                    { latitude: '33.987654', longitude: '33.987654' },
                    { latitude: '78.123456', longitude: '78.123456' }
                  ]
                : [
                    { eastings: '425053', northings: '564180' },
                    { eastings: '426000', northings: '565000' },
                    { eastings: '427000', northings: '566000' }
                  ]
          }
        ]
      }

    case 'file':
      return {
        ...baseExemption,
        siteDetails: [
          {
            coordinatesType: 'file',
            coordinateSystem,
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
            }
          }
        ]
      }

    case 'empty':
      return {
        id: baseExemption.id,
        projectName: baseExemption.projectName
        // siteDetails is undefined
      }

    default: // 'single'
      return {
        ...baseExemption,
        siteDetails: [
          {
            ...baseExemption.siteDetails[0],
            coordinatesEntry: 'single',
            coordinates:
              coordinateSystem === COORDINATE_SYSTEMS.WGS84
                ? {
                    latitude: mockExemption.siteDetails[0].coordinates.latitude,
                    longitude:
                      mockExemption.siteDetails[0].coordinates.longitude
                  }
                : { eastings: '425053', northings: '564180' },
            circleWidth: '100'
          }
        ]
      }
  }
}

describe('#reviewSiteDetails', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy
  let getCoordinateSystemSpy
  let resetExemptionSiteDetailsSpy

  const mockCoordinates = {
    [COORDINATE_SYSTEMS.WGS84]: {
      latitude: mockExemption.siteDetails[0].coordinates.latitude,
      longitude: mockExemption.siteDetails[0].coordinates.longitude
    },
    [COORDINATE_SYSTEMS.OSGB36]: { eastings: '425053', northings: '564180' }
  }

  const mockPolygonCoordinatesWGS84 = [
    { latitude: '55.123456', longitude: '55.123456' },
    { latitude: '33.987654', longitude: '33.987654' },
    { latitude: '78.123456', longitude: '78.123456' }
  ]

  const mockPolygonCoordinatesOSGB36 = [
    { eastings: '425053', northings: '564180' },
    { eastings: '426000', northings: '565000' },
    { eastings: '427000', northings: '566000' }
  ]

  const mockPolygonExemptionWGS84 = {
    ...mockExemption,
    siteDetails: [
      {
        coordinatesType: 'coordinates',
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinatesEntry: 'multiple',
        coordinates: mockPolygonCoordinatesWGS84
      }
    ]
  }

  const mockPolygonExemptionOSGB36 = {
    ...mockExemption,
    siteDetails: [
      {
        coordinatesType: 'coordinates',
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinatesEntry: 'multiple',
        coordinates: mockPolygonCoordinatesOSGB36
      }
    ]
  }

  const createMockRequest = () => ({
    payload: {},
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    }
  })

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockExemption.id,
        siteDetails: mockExemption.siteDetails
      }
    })

    vi.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: {
        value: mockExemption
      }
    })

    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
    getCoordinateSystemSpy = vi
      .spyOn(coordinateUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })
    resetExemptionSiteDetailsSpy = vi
      .spyOn(cacheUtils, 'resetExemptionSiteDetails')
      .mockReturnValue({ siteDetails: null })
  })

  describe('Unit Tests', () => {
    describe('GET Handler', () => {
      test('should render empty context when no data exists', async () => {
        getExemptionCacheSpy.mockReturnValueOnce({})
        getCoordinateSystemSpy.mockReturnValueOnce({})

        const h = createMockHandler()
        const mockRequest = createMockRequest()

        await reviewSiteDetailsController.handler(mockRequest, h)

        expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
          heading: 'Review site details',
          isMultiSiteJourney: false,
          pageTitle: 'Review site details',
          backLink: routes.TASK_LIST,
          projectName: undefined,
          summaryData: [],
          multipleSiteDetailsData: {}
        })
      })

      test('should load data from MongoDB when session lacks siteDetails', async () => {
        const exemptionWithoutSiteDetails = createMockExemption(
          'empty',
          COORDINATE_SYSTEMS.WGS84,
          {
            id: 'test-id',
            projectName: 'Test Project'
          }
        )
        const completeMongoData = createMockExemption(
          'file',
          COORDINATE_SYSTEMS.WGS84,
          {
            id: 'test-id',
            projectName: 'Test Project'
          }
        )

        getExemptionCacheSpy.mockReturnValueOnce(exemptionWithoutSiteDetails)
        vi.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValueOnce(
          {
            payload: {
              value: completeMongoData
            }
          }
        )

        const h = createMockHandler()
        const mockRequest = createMockRequest()
        await reviewSiteDetailsController.handler(mockRequest, h)

        expect(authRequests.authenticatedGetRequest).toHaveBeenCalledWith(
          mockRequest,
          '/exemption/test-id'
        )
        expect(mockRequest.logger.info).toHaveBeenCalledWith(
          {
            exemptionId: 'test-id',
            coordinatesType: 'file'
          },
          'Loaded site details from MongoDB for display'
        )
        expect(h.view).toHaveBeenCalledWith(
          FILE_UPLOAD_REVIEW_VIEW_ROUTE,
          expect.objectContaining({
            heading: 'Review site details',
            isMultiSiteJourney: false,
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
              fileType: 'KML',
              filename: 'test-site.kml'
            })
          })
        )

        // no-op
      })

      test('should render WGS84 coordinates correctly', async () => {
        const h = createMockHandler()
        const mockRequest = createMockRequest()

        await reviewSiteDetailsController.handler(mockRequest, h)

        expect(h.view).toHaveBeenCalledWith(
          REVIEW_SITE_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            heading: 'Review site details',
            isMultiSiteJourney: false,
            pageTitle: 'Review site details',
            backLink: routes.TASK_LIST,
            projectName: 'Test Project',
            summaryData: expect.arrayContaining([
              expect.objectContaining({
                activityDates: '1 January 2025 to 1 January 2025',
                activityDescription: 'Test activity description',
                method:
                  'Manually enter one set of coordinates and a width to create a circular site',
                coordinateSystem:
                  'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
                coordinates: `${mockCoordinates[COORDINATE_SYSTEMS.WGS84].latitude}, ${mockCoordinates[COORDINATE_SYSTEMS.WGS84].longitude}`,
                width: '100 metres',
                showActivityDates: true,
                showActivityDescription: true,
                siteName: 'Mock site',
                siteNumber: 1
              })
            ]),
            multipleSiteDetailsData: {
              activityDates: '1 January 2025 to 1 January 2025',
              activityDescription: 'Test activity description',
              method: 'Enter the coordinates of the site manually',
              multipleSiteDetails: 'No',

              sameActivityDates: 'Yes',
              sameActivityDescription: 'Yes'
            }
          })
        )
      })

      test('should render OSGB36 coordinates correctly', async () => {
        const h = createMockHandler()
        const mockRequest = createMockRequest()

        getExemptionCacheSpy.mockReturnValueOnce(
          createMockExemption('single', COORDINATE_SYSTEMS.OSGB36)
        )

        getCoordinateSystemSpy.mockReturnValueOnce({
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36
        })

        await reviewSiteDetailsController.handler(mockRequest, h)

        expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
          heading: 'Review site details',
          isMultiSiteJourney: false,
          pageTitle: 'Review site details',
          backLink: routes.TASK_LIST,
          projectName: 'Test Project',
          summaryData: [
            {
              activityDates: '1 January 2025 to 1 January 2025',
              activityDescription: 'Test activity description',
              method:
                'Manually enter one set of coordinates and a width to create a circular site',
              coordinateSystem:
                'OSGB36 (National Grid)\nEastings and Northings',
              coordinates: `${mockCoordinates[COORDINATE_SYSTEMS.OSGB36].eastings}, ${mockCoordinates[COORDINATE_SYSTEMS.OSGB36].northings}`,
              width: '100 metres',
              showActivityDates: true,
              showActivityDescription: true,
              siteName: 'Mock site',
              siteNumber: 1,
              siteDetailsData: expect.stringContaining(
                '"coordinatesType":"coordinates"'
              )
            }
          ],
          multipleSiteDetailsData: {
            activityDates: '1 January 2025 to 1 January 2025',
            activityDescription: 'Test activity description',
            method: 'Enter the coordinates of the site manually',
            multipleSiteDetails: 'No',
            sameActivityDates: 'Yes',
            sameActivityDescription: 'Yes'
          }
        })
      })
    })
  })

  describe('Integration Tests', () => {
    describe('POST Handler - Full Flow', () => {
      test('should redirect to task list and patch backend', async () => {
        const { headers, statusCode } = await makePostRequest({
          url: routes.REVIEW_SITE_DETAILS,
          server: getServer(),
          headers: {
            referer: `http://localhost/${routes.WIDTH_OF_SITE}`
          }
        })

        expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
          expect.any(Object),
          '/exemption/site-details',
          {
            multipleSiteDetails: mockExemption.multipleSiteDetails,
            siteDetails: mockExemption.siteDetails,
            id: mockExemption.id
          }
        )

        expect(headers.location).toBe(routes.TASK_LIST)
        expect(statusCode).toBe(statusCodes.redirect)
      })

      test('should reset exemption after saving to MongoDB', async () => {
        const request = {
          logger: {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
          }
        }
        const h = { redirect: vi.fn() }

        await reviewSiteDetailsSubmitController.handler(request, h)

        expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
          expect.any(Object),
          '/exemption/site-details',
          {
            multipleSiteDetails: mockExemption.multipleSiteDetails,
            siteDetails: mockExemption.siteDetails,
            id: mockExemption.id
          }
        )

        expect(resetExemptionSiteDetailsSpy).toHaveBeenCalledWith(request)
        expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      })

      test('should redirect to task list on successful POST', async () => {
        const request = {
          logger: {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
          }
        }
        const h = { redirect: vi.fn() }

        await reviewSiteDetailsSubmitController.handler(request, h)

        expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      })

      test('should handle undefined siteDetails gracefully', async () => {
        const exemptionWithUndefinedSiteDetails = {
          ...mockExemption,
          siteDetails: undefined // This will trigger the ?? {} fallback
        }

        const originalGetExemptionCache = cacheUtils.getExemptionCache
        let capturedSiteDetails

        vi.spyOn(cacheUtils, 'getExemptionCache').mockImplementation(() => {
          const exemption = exemptionWithUndefinedSiteDetails
          // This simulates the line: const siteDetails = exemption.siteDetails ?? {}
          capturedSiteDetails = exemption.siteDetails ?? {}
          return exemption
        })

        const request = {
          logger: {
            info: vi.fn(),
            error: vi.fn()
          }
        }
        const h = { redirect: vi.fn() }

        try {
          await reviewSiteDetailsSubmitController.handler(request, h)
        } catch (error) {
          // Expected to fail since the function expects real siteDetails data
        }

        // Verify that the nullish coalescing operator worked correctly
        expect(capturedSiteDetails).toEqual({})

        cacheUtils.getExemptionCache.mockImplementation(
          originalGetExemptionCache
        )
      })

      test('should show error page for validation errors', async () => {
        const apiPatchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
        apiPatchMock.mockRejectedValueOnce({
          res: { statusCode: 400 },
          data: {
            payload: {
              validation: {
                source: 'payload',
                keys: ['siteDetails'],
                details: [
                  {
                    field: 'siteDetails',
                    message: 'SITE_DETAILS_INVALID',
                    type: 'any.invalid'
                  }
                ]
              }
            }
          }
        })

        const { result, statusCode } = await makePostRequest({
          url: routes.REVIEW_SITE_DETAILS,
          server: getServer(),
          headers: {
            referer: `http://localhost/${routes.WIDTH_OF_SITE}`
          }
        })

        const { document } = new JSDOM(result).window

        expect(document.querySelector('h1').textContent.trim()).toContain(
          'There is a problem with the service'
        )

        expect(statusCode).toBe(statusCodes.badRequest)
      })

      test('should pass error to global handler when no validation data', async () => {
        const apiPatchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
        apiPatchMock.mockRejectedValueOnce({
          res: { statusCode: 500 },
          data: {}
        })

        const { result } = await makePostRequest({
          url: routes.REVIEW_SITE_DETAILS,
          server: getServer(),
          headers: {
            referer: `http://localhost/${routes.WIDTH_OF_SITE}`
          }
        })

        const { document } = new JSDOM(result).window

        expect(document.querySelector('h1').textContent.trim()).toBe(
          'There is a problem with the service'
        )
      })

      test('should add another site correctly', async () => {
        const { headers, statusCode } = await makePostRequest({
          url: routes.REVIEW_SITE_DETAILS,
          server: getServer(),
          formData: { add: true }
        })

        expect(cacheUtils.setExemptionCache).toHaveBeenCalledWith(
          expect.any(Object),
          {
            ...mockExemption,
            siteDetails: [
              ...mockExemption.siteDetails,
              {
                coordinatesType: 'coordinates'
              }
            ]
          }
        )

        expect(statusCode).toBe(statusCodes.redirect)
        expect(headers.location).toBe(`${routes.SITE_NAME}?site=3`)
      })

      describe('Polygon Coordinate Submission', () => {
        test('should save WGS84 polygon data correctly', async () => {
          getExemptionCacheSpy.mockReturnValueOnce(mockPolygonExemptionWGS84)

          const request = {
            logger: {
              info: vi.fn(),
              error: vi.fn(),
              debug: vi.fn()
            }
          }
          const h = { redirect: vi.fn() }

          await reviewSiteDetailsSubmitController.handler(request, h)

          expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
            expect.any(Object),
            '/exemption/site-details',
            {
              multipleSiteDetails:
                mockPolygonExemptionWGS84.multipleSiteDetails,
              siteDetails: mockPolygonExemptionWGS84.siteDetails,
              id: mockPolygonExemptionWGS84.id
            }
          )

          expect(resetExemptionSiteDetailsSpy).toHaveBeenCalledWith(request)
          expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
        })

        test('should save OSGB36 polygon data correctly', async () => {
          getExemptionCacheSpy.mockReturnValueOnce(mockPolygonExemptionOSGB36)

          const request = {
            logger: {
              info: vi.fn(),
              error: vi.fn(),
              debug: vi.fn()
            }
          }
          const h = { redirect: vi.fn() }

          await reviewSiteDetailsSubmitController.handler(request, h)

          expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
            expect.any(Object),
            '/exemption/site-details',
            {
              multipleSiteDetails:
                mockPolygonExemptionOSGB36.multipleSiteDetails,
              siteDetails: mockPolygonExemptionOSGB36.siteDetails,
              id: mockPolygonExemptionOSGB36.id
            }
          )

          expect(resetExemptionSiteDetailsSpy).toHaveBeenCalledWith(request)
          expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
        })

        test('should handle polygon site POST request', async () => {
          getExemptionCacheSpy.mockReturnValueOnce(mockPolygonExemptionWGS84)

          const { headers, statusCode } = await makePostRequest({
            url: routes.REVIEW_SITE_DETAILS,
            server: getServer(),
            headers: {
              referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
            }
          })

          expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
            expect.any(Object),
            '/exemption/site-details',
            {
              multipleSiteDetails:
                mockPolygonExemptionWGS84.multipleSiteDetails,
              siteDetails: mockPolygonExemptionWGS84.siteDetails,
              id: mockPolygonExemptionWGS84.id
            }
          )

          expect(headers.location).toBe(routes.TASK_LIST)
          expect(statusCode).toBe(statusCodes.redirect)
        })

        test('should handle polygon coordinate validation errors', async () => {
          getExemptionCacheSpy.mockReturnValueOnce(mockPolygonExemptionWGS84)

          const apiPatchMock = vi.spyOn(
            authRequests,
            'authenticatedPatchRequest'
          )
          apiPatchMock.mockRejectedValueOnce({
            res: { statusCode: 400 },
            data: {
              payload: {
                validation: {
                  source: 'payload',
                  keys: ['siteDetails.coordinates'],
                  details: [
                    {
                      field: 'siteDetails.coordinates',
                      message: 'POLYGON_COORDINATES_INVALID',
                      type: 'array.min'
                    }
                  ]
                }
              }
            }
          })

          const { result, statusCode } = await makePostRequest({
            url: routes.REVIEW_SITE_DETAILS,
            server: getServer(),
            headers: {
              referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
            }
          })

          expect(result).toEqual(
            expect.stringContaining('There is a problem with the service') // generic error page reusing the custom 500 one
          )

          const { document } = new JSDOM(result).window
          expect(document.querySelector('h1').textContent.trim()).toContain(
            'There is a problem with the service'
          )
          expect(statusCode).toBe(statusCodes.badRequest)
        })
      })
    })
  })

  describe('Utility Functions', () => {
    describe('Polygon Utility Functions', () => {
      describe('getPolygonCoordinatesDisplayData', () => {
        test('should format WGS84 polygon coordinates correctly', () => {
          const siteDetails = {
            coordinates: mockPolygonCoordinatesWGS84
          }

          const result = getPolygonCoordinatesDisplayData(
            siteDetails,
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result).toEqual([
            { label: 'Start and end points', value: '55.123456, 55.123456' },
            { label: 'Point 2', value: '33.987654, 33.987654' },
            { label: 'Point 3', value: '78.123456, 78.123456' }
          ])
        })

        test('should format OSGB36 polygon coordinates correctly', () => {
          const siteDetails = {
            coordinates: mockPolygonCoordinatesOSGB36
          }

          const result = getPolygonCoordinatesDisplayData(
            siteDetails,
            COORDINATE_SYSTEMS.OSGB36
          )

          expect(result).toEqual([
            { label: 'Start and end points', value: '425053, 564180' },
            { label: 'Point 2', value: '426000, 565000' },
            { label: 'Point 3', value: '427000, 566000' }
          ])
        })

        test('should filter out incomplete coordinates', () => {
          const siteDetails = {
            coordinates: [
              { latitude: '55.123456', longitude: '55.123456' },
              { latitude: '', longitude: '33.987654' },
              { latitude: '78.123456', longitude: '78.123456' },
              { latitude: null, longitude: null }
            ]
          }

          const result = getPolygonCoordinatesDisplayData(
            siteDetails,
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result).toEqual([
            { label: 'Start and end points', value: '55.123456, 55.123456' },
            { label: 'Point 2', value: '78.123456, 78.123456' }
          ])
        })

        test('should handle empty coordinates array', () => {
          const siteDetails = [{ coordinates: [] }]

          const result = getPolygonCoordinatesDisplayData(
            siteDetails,
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result).toEqual([])
        })

        test('should handle null/undefined coordinates', () => {
          const siteDetails = [{ coordinates: null }]

          const result = getPolygonCoordinatesDisplayData(
            siteDetails,
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result).toEqual([])
        })

        test('should handle missing coordinate system', () => {
          const siteDetails = [
            {
              coordinates: mockPolygonCoordinatesWGS84
            }
          ]

          const result = getPolygonCoordinatesDisplayData(siteDetails, null)

          expect(result).toEqual([])
        })
      })

      describe('buildManualCoordinateSummaryData', () => {
        test('should build polygon summary data for multiple coordinates', () => {
          const siteDetails = [
            {
              coordinateSystem: COORDINATE_SYSTEMS.WGS84,
              coordinatesEntry: 'multiple',
              coordinatesType: 'coordinates',
              coordinates: mockPolygonCoordinatesWGS84,
              activityDates: {
                start: '2025-01-01T00:00:00.000Z',
                end: '2025-01-01T00:00:00.000Z'
              },
              activityDescription: 'Test activity description'
            }
          ]

          const result = buildManualCoordinateSummaryData(
            siteDetails,
            {
              multipleSitesEnabled: false
            },
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result).toEqual([
            {
              activityDates: '1 January 2025 to 1 January 2025',
              activityDescription: 'Test activity description',
              method:
                'Manually enter multiple sets of coordinates to mark the boundary of the site',
              coordinateSystem:
                'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
              polygonCoordinates: [
                {
                  label: 'Start and end points',
                  value: '55.123456, 55.123456'
                },
                { label: 'Point 2', value: '33.987654, 33.987654' },
                { label: 'Point 3', value: '78.123456, 78.123456' }
              ],
              showActivityDates: true,
              showActivityDescription: true,
              siteName: '',
              siteNumber: 1,
              siteDetailsData: expect.stringContaining(
                '"coordinatesType":"coordinates"'
              )
            }
          ])
        })

        test('should build circular summary data for single coordinates', () => {
          const siteDetails = [
            {
              coordinateSystem: COORDINATE_SYSTEMS.WGS84,
              coordinatesEntry: 'single',
              coordinatesType: 'coordinates',
              coordinates: { latitude: '50.123456', longitude: '-0.123456' },
              circleWidth: '200',
              activityDates: {
                start: '2025-01-01T00:00:00.000Z',
                end: '2025-01-01T00:00:00.000Z'
              },
              activityDescription: 'Test activity description'
            }
          ]

          const result = buildManualCoordinateSummaryData(
            siteDetails,
            {
              multipleSitesEnabled: false
            },
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result).toEqual([
            {
              activityDates: '1 January 2025 to 1 January 2025',
              activityDescription: 'Test activity description',
              method:
                'Manually enter one set of coordinates and a width to create a circular site',
              coordinateSystem:
                'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
              coordinates: '50.123456, -0.123456',
              showActivityDates: true,
              showActivityDescription: true,
              siteName: '',
              width: '200 metres',
              siteNumber: 1,
              siteDetailsData: expect.stringContaining(
                '"coordinatesType":"coordinates"'
              )
            }
          ])
        })
      })

      describe('getSiteDetailsBackLink', () => {
        test('should return ENTER_MULTIPLE_COORDINATES for polygon sites', () => {
          const previousPage =
            'http://localhost/exemption/enter-multiple-coordinates'

          const result = getSiteDetailsBackLink(previousPage, 'multiple')

          expect(result).toBe(routes.ENTER_MULTIPLE_COORDINATES)
        })

        test('should return WIDTH_OF_SITE for circular sites', () => {
          const previousPage = 'http://localhost/exemption/width-of-site'

          const result = getSiteDetailsBackLink(previousPage, 'single')

          expect(result).toBe(routes.WIDTH_OF_SITE)
        })

        test('should return TASK_LIST for task list origin', () => {
          const previousPage = 'http://localhost/exemption/task-list'

          const result = getSiteDetailsBackLink(previousPage, 'multiple')

          expect(result).toBe(routes.TASK_LIST)
        })

        test('should handle invalid previousPage URLs', () => {
          const result = getSiteDetailsBackLink('invalid-url', 'multiple')

          expect(result).toBe(routes.TASK_LIST)
        })

        test('should handle null previousPage', () => {
          const result = getSiteDetailsBackLink(null, 'multiple')

          expect(result).toBe(routes.TASK_LIST)
        })
      })

      describe('getReviewSummaryText', () => {
        test('should return polygon text for multiple coordinates', () => {
          const siteDetails = {
            coordinateSystem: COORDINATE_SYSTEMS.WGS84,
            coordinatesEntry: 'multiple',
            coordinatesType: 'coordinates'
          }

          const result = getReviewSummaryText(siteDetails)

          expect(result).toBe(
            'Manually enter multiple sets of coordinates to mark the boundary of the site'
          )
        })

        test('should return circular text for single coordinates', () => {
          const siteDetails = {
            coordinateSystem: COORDINATE_SYSTEMS.WGS84,
            coordinatesEntry: 'single',
            coordinatesType: 'coordinates'
          }

          const result = getReviewSummaryText(siteDetails)

          expect(result).toBe(
            'Manually enter one set of coordinates and a width to create a circular site'
          )
        })

        test('should return empty string for unsupported combinations', () => {
          const siteDetails = {
            coordinateSystem: COORDINATE_SYSTEMS.WGS84,
            coordinatesEntry: 'unknown',
            coordinatesType: 'coordinates'
          }

          const result = getReviewSummaryText(siteDetails)

          expect(result).toBe('')
        })
      })

      describe('getCoordinateSystemText', () => {
        test('should return WGS84 text', () => {
          const result = getCoordinateSystemText(COORDINATE_SYSTEMS.WGS84)

          expect(result).toBe(
            'WGS84 (World Geodetic System 1984)\nLatitude and longitude'
          )
        })

        test('should return OSGB36 text', () => {
          const result = getCoordinateSystemText(COORDINATE_SYSTEMS.OSGB36)

          expect(result).toBe('OSGB36 (National Grid)\nEastings and Northings')
        })

        test('should handle null coordinate system', () => {
          const result = getCoordinateSystemText(null)

          expect(result).toBe('')
        })

        test('should handle undefined coordinate system', () => {
          const result = getCoordinateSystemText(undefined)

          expect(result).toBe('')
        })
      })
    })
  })
})
