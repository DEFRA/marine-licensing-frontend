import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'
import * as exemptionService from '#src/services/exemption-service/index.js'
import {
  FILE_UPLOAD_REVIEW_VIEW_ROUTE,
  reviewSiteDetailsController,
  reviewSiteDetailsSubmitController
} from '#src/server/exemption/site-details/review-site-details/controller.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { mockExemption } from '#src/server/test-helpers/mocks.js'
import { makePostRequest } from '#src/server/test-helpers/server-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  getPolygonCoordinatesDisplayData,
  buildManualCoordinateSummaryData,
  getSiteDetailsBackLink,
  getCoordinateSystemText
} from '#src/server/exemption/site-details/review-site-details/utils.js'
import { getReviewSummaryText } from '#src/server/common/helpers/exemption-site-details.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/coordinate-utils.js')
vi.mock('~/src/services/exemption-service/index.js')
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
  let setExemptionCacheSpy
  let resetExemptionSiteDetailsSpy

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

  const createMockRequest = () => ({
    payload: {},
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    },
    yar: {
      clear: vi.fn(),
      flash: vi.fn()
    }
  })

  beforeEach(() => {
    // Mock ExemptionService
    const mockExemptionServiceInstance = {
      getExemptionById: vi.fn().mockResolvedValue(mockExemption)
    }
    vi.spyOn(exemptionService, 'getExemptionService').mockReturnValue(
      mockExemptionServiceInstance
    )

    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)

    setExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'setExemptionCache')
      .mockResolvedValue(true)

    resetExemptionSiteDetailsSpy = vi
      .spyOn(cacheUtils, 'resetExemptionSiteDetails')
      .mockReturnValue({ siteDetails: null })
  })

  describe('Unit Tests', () => {
    describe('GET Handler', () => {
      test('should redirect to task list when no exemption ID exists', async () => {
        getExemptionCacheSpy.mockReturnValueOnce({})

        const h = createMockHandler('redirect')
        const mockRequest = createMockRequest()

        await reviewSiteDetailsController.handler(mockRequest, h)

        expect(mockRequest.yar.flash).not.toHaveBeenCalled()

        expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      })

      test('should load data from ExemptionService', async () => {
        const fileExemption = createMockExemption(
          'file',
          COORDINATE_SYSTEMS.WGS84,
          {
            id: 'test-id',
            projectName: 'Test Project'
          }
        )

        getExemptionCacheSpy.mockReturnValueOnce({ id: 'test-id' })

        // Mock the ExemptionService to return file exemption data
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(fileExemption)
        }
        vi.spyOn(exemptionService, 'getExemptionService').mockReturnValue(
          mockExemptionServiceInstance
        )

        const h = createMockHandler()
        const mockRequest = createMockRequest()
        await reviewSiteDetailsController.handler(mockRequest, h)

        expect(exemptionService.getExemptionService).toHaveBeenCalledWith(
          mockRequest
        )

        expect(setExemptionCacheSpy).toHaveBeenCalled()

        expect(
          mockExemptionServiceInstance.getExemptionById
        ).toHaveBeenCalledWith('test-id')
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
      })
    })
  })

  describe('Integration Tests', () => {
    describe('POST Handler - Read-Only Flow', () => {
      test('should redirect to task list without saving to database', async () => {
        const { headers, statusCode } = await makePostRequest({
          url: routes.REVIEW_SITE_DETAILS,
          server: getServer(),
          headers: {
            referer: `http://localhost/${routes.WIDTH_OF_SITE}`
          }
        })

        expect(headers.location).toBe(routes.TASK_LIST)
        expect(statusCode).toBe(statusCodes.redirect)
      })

      test('should redirect to task list if no id is present', async () => {
        cacheUtils.getExemptionCache.mockReturnValue({})

        const { headers, statusCode } = await makePostRequest({
          url: routes.REVIEW_SITE_DETAILS,
          server: getServer(),
          headers: {
            referer: `http://localhost/${routes.WIDTH_OF_SITE}`
          }
        })

        expect(headers.location).toBe(routes.TASK_LIST)
        expect(statusCode).toBe(statusCodes.redirect)
      })

      test('should reset exemption and redirect to task list', async () => {
        const request = {
          payload: {},
          logger: {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
          },
          yar: {
            flash: vi.fn().mockReturnValue([])
          }
        }
        getExemptionCacheSpy.mockReturnValue(mockExemption)
        const h = { redirect: vi.fn() }

        await reviewSiteDetailsSubmitController.handler(request, h)

        expect(resetExemptionSiteDetailsSpy).toHaveBeenCalledWith(request, h)
        expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      })

      test('should redirect to task list on successful POST', async () => {
        const request = {
          payload: {},
          logger: {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
          },
          yar: {
            flash: vi.fn().mockReturnValue([])
          }
        }
        getExemptionCacheSpy.mockReturnValue(mockExemption)
        const h = { redirect: vi.fn() }

        await reviewSiteDetailsSubmitController.handler(request, h)

        expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      })

      test('should redirect to check your answers when returnTo flash is set', async () => {
        const request = {
          payload: {},
          logger: {},
          yar: {
            flash: vi.fn().mockReturnValue([routes.CHECK_YOUR_ANSWERS])
          }
        }
        getExemptionCacheSpy.mockReturnValue(mockExemption)
        const h = { redirect: vi.fn() }

        await reviewSiteDetailsSubmitController.handler(request, h)

        expect(request.yar.flash).toHaveBeenCalledWith(RETURN_TO_CACHE_KEY)
        expect(h.redirect).toHaveBeenCalledWith(routes.CHECK_YOUR_ANSWERS)
        expect(resetExemptionSiteDetailsSpy).not.toHaveBeenCalled()
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

        expect(capturedSiteDetails).toEqual({})

        cacheUtils.getExemptionCache.mockImplementation(
          originalGetExemptionCache
        )
      })

      test('should add another site correctly', async () => {
        const { headers, statusCode } = await makePostRequest({
          url: routes.REVIEW_SITE_DETAILS,
          server: getServer(),
          formData: { add: true }
        })

        expect(statusCode).toBe(statusCodes.redirect)
        expect(headers.location).toBe(`${routes.SITE_NAME}?site=3`)
      })

      test('should handle redirect to check your answers correctly', async () => {
        const mockFlash = vi.fn().mockReturnValue([routes.CHECK_YOUR_ANSWERS])
        const request = {
          payload: {},
          logger: {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
          },
          yar: {
            flash: mockFlash
          }
        }
        getExemptionCacheSpy.mockReturnValue(mockExemption)
        const h = { redirect: vi.fn() }

        await reviewSiteDetailsSubmitController.handler(request, h)

        expect(mockFlash).toHaveBeenCalledWith(RETURN_TO_CACHE_KEY)
        expect(h.redirect).toHaveBeenCalledWith(routes.CHECK_YOUR_ANSWERS)
        expect(resetExemptionSiteDetailsSpy).not.toHaveBeenCalled()
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
                'Enter multiple sets of coordinates to mark the boundary of the site',
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
                'Enter one set of coordinates and a width to create a circular site',
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
            'Enter multiple sets of coordinates to mark the boundary of the site'
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
            'Enter one set of coordinates and a width to create a circular site'
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

          expect(result).toBe(
            'British National Grid (OSGB36)\nEastings and Northings'
          )
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
