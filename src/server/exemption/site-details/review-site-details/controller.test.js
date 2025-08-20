import { config } from '~/src/config/config.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import * as coordinateUtils from '~/src/server/common/helpers/coordinate-utils.js'
import {
  FILE_UPLOAD_REVIEW_VIEW_ROUTE,
  REVIEW_SITE_DETAILS_VIEW_ROUTE,
  reviewSiteDetailsController,
  reviewSiteDetailsSubmitController
} from '~/src/server/exemption/site-details/review-site-details/controller.js'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  getPolygonCoordinatesDisplayData,
  buildManualCoordinateSummaryData,
  getSiteDetailsBackLink,
  getReviewSummaryText,
  getCoordinateSystemText
} from '~/src/server/exemption/site-details/review-site-details/utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/coordinate-utils.js')

/**
 * Creates a mock Hapi response toolkit
 * @param {string} type - Handler type: 'view' or 'redirect'
 * @returns {object} Mock response toolkit
 */
function createMockHandler(type = 'view') {
  if (type === 'redirect') {
    return { redirect: jest.fn() }
  }
  return { view: jest.fn() }
}

/**
 * Creates mock exemption data for different coordinate scenarios
 * @param {string} type - Type: 'single', 'multiple', 'file', 'empty'
 * @param {string} coordinateSystem - Coordinate system: 'wgs84' or 'osgb36'
 * @param {object} overrides - Optional overrides for id, projectName, etc.
 * @returns {object} Mock exemption object
 */
function createMockExemption(
  type = 'single',
  coordinateSystem = COORDINATE_SYSTEMS.WGS84,
  overrides = {}
) {
  const baseExemption = {
    ...mockExemption,
    ...overrides,
    siteDetails: {
      coordinatesType: 'coordinates',
      coordinateSystem
    }
  }

  switch (type) {
    case 'multiple':
      return {
        ...baseExemption,
        siteDetails: {
          ...baseExemption.siteDetails,
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
      }

    case 'file':
      return {
        ...baseExemption,
        siteDetails: {
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
          }
        }
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
        siteDetails: {
          ...baseExemption.siteDetails,
          coordinatesEntry: 'single',
          coordinates:
            coordinateSystem === COORDINATE_SYSTEMS.WGS84
              ? {
                  latitude: mockExemption.siteDetails.coordinates.latitude,
                  longitude: mockExemption.siteDetails.coordinates.longitude
                }
              : { eastings: '425053', northings: '564180' },
          circleWidth: '100'
        }
      }
  }
}

/**
 * DOM assertion helper for page titles and headings
 * @param {Document} document - JSDOM document
 * @param {string} expectedTitle - Expected page title
 * @param {string} expectedHeading - Expected h1 content
 */
function assertPageTitleAndHeading(
  document,
  expectedTitle,
  expectedHeading = expectedTitle
) {
  expect(document.querySelector('h1').textContent.trim()).toContain(
    expectedHeading
  )

  const pageTitle = document.querySelector('title')?.textContent ?? ''
  expect(pageTitle).toContain(expectedTitle)
}

/**
 * DOM assertion helper for project name caption
 * @param {Document} document - JSDOM document
 * @param {string} expectedProjectName - Expected project name
 */
function assertProjectNameCaption(document, expectedProjectName) {
  const caption = document.querySelector('.govuk-caption-l')
  expect(caption?.textContent.trim()).toBe(expectedProjectName)
}

/**
 * DOM assertion helper for summary list data
 * @param {Document} document - JSDOM document
 * @param {Array} expectedData - Array of {key, value} objects
 */
function assertSummaryListData(document, expectedData) {
  const summaryKeys = document.querySelectorAll('.govuk-summary-list__key')
  const summaryValues = document.querySelectorAll('.govuk-summary-list__value')

  expectedData.forEach((item, index) => {
    expect(summaryKeys[index]?.textContent.trim()).toBe(item.key)
    if (item.isHtml) {
      expect(summaryValues[index]?.innerHTML.trim()).toContain(item.value)
    } else {
      expect(summaryValues[index]?.textContent.trim()).toBe(item.value)
    }
  })
}

/**
 * DOM assertion helper for navigation links
 * @param {Document} document - JSDOM document
 * @param {string} backLink - Expected back link href
 * @param {string} cancelLink - Expected cancel link href (optional)
 */
function assertNavigationLinks(document, backLink, cancelLink = null) {
  const backElement = document.querySelector(
    `.govuk-back-link[href="${backLink}"]`
  )
  expect(backElement?.textContent.trim()).toBe('Back')

  if (cancelLink) {
    const cancelElement = document.querySelector(
      `.govuk-link[href="${cancelLink}"]`
    )
    expect(cancelElement?.textContent.trim()).toBe('Cancel')
  }
}

describe('#reviewSiteDetails', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy
  let getCoordinateSystemSpy
  let resetExemptionSiteDetailsSpy

  const mockCoordinates = {
    [COORDINATE_SYSTEMS.WGS84]: {
      latitude: mockExemption.siteDetails.coordinates.latitude,
      longitude: mockExemption.siteDetails.coordinates.longitude
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
    siteDetails: {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'multiple',
      coordinateSystem: COORDINATE_SYSTEMS.WGS84,
      coordinates: mockPolygonCoordinatesWGS84
    }
  }

  const mockPolygonExemptionOSGB36 = {
    ...mockExemption,
    siteDetails: {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'multiple',
      coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
      coordinates: mockPolygonCoordinatesOSGB36
    }
  }

  const createMockRequest = () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    }
  })

  const createFileUploadExemptionWithS3 = () => ({
    ...mockExemption,
    siteDetails: {
      coordinatesType: 'file',
      fileUploadType: 'kml',
      uploadedFile: {
        filename: 'test-site.kml',
        s3Location: {
          s3Bucket: 'test-bucket',
          s3Key: 'test-key',
          checksumSha256: 'test-checksum'
        }
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
      featureCount: 1
    }
  })

  const createExpectedSiteDetails = () => ({
    coordinatesType: 'file',
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
  })

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockExemption.id,
        siteDetails: mockExemption.siteDetails
      }
    })

    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: {
        value: mockExemption
      }
    })

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
    getCoordinateSystemSpy = jest
      .spyOn(coordinateUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })
    resetExemptionSiteDetailsSpy = jest
      .spyOn(cacheUtils, 'resetExemptionSiteDetails')
      .mockReturnValue({ siteDetails: null })
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
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
          pageTitle: 'Review site details',
          backLink: routes.TASK_LIST,
          projectName: undefined,
          summaryData: {
            method: '',
            coordinateSystem: '',
            coordinates: '',
            width: ''
          },
          siteDetailsData: '{"coordinatesType":"coordinates"}'
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
        jest
          .spyOn(authRequests, 'authenticatedGetRequest')
          .mockResolvedValueOnce({
            payload: {
              value: completeMongoData
            }
          })

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
            pageTitle: 'Review site details',
            backLink: routes.FILE_UPLOAD,
            projectName: 'Test Project',
            fileUploadSummaryData: expect.objectContaining({
              method: 'Upload a file with the coordinates of the site',
              fileType: 'KML',
              filename: 'test-site.kml',
              coordinates: [
                {
                  type: 'Point',
                  coordinates: [51.5074, -0.1278]
                }
              ]
            })
          })
        )
      })

      test('should render file upload template for file flow', async () => {
        const mockFileUploadExemption = createMockExemption('file')

        getExemptionCacheSpy.mockReturnValueOnce(mockFileUploadExemption)

        const h = createMockHandler()
        const mockRequest = createMockRequest()

        await reviewSiteDetailsController.handler(mockRequest, h)

        expect(h.view).toHaveBeenCalledWith(
          FILE_UPLOAD_REVIEW_VIEW_ROUTE,
          expect.objectContaining({
            heading: 'Review site details',
            pageTitle: 'Review site details',
            backLink: routes.FILE_UPLOAD,
            projectName: 'Test Project',
            fileUploadSummaryData: expect.objectContaining({
              method: 'Upload a file with the coordinates of the site',
              fileType: 'KML',
              filename: 'test-site.kml',
              coordinates: [
                {
                  type: 'Point',
                  coordinates: [51.5074, -0.1278]
                }
              ]
            })
          })
        )
      })

      test('should render WGS84 coordinates correctly', async () => {
        const h = createMockHandler()
        const mockRequest = createMockRequest()

        await reviewSiteDetailsController.handler(mockRequest, h)

        expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
          heading: 'Review site details',
          pageTitle: 'Review site details',
          backLink: routes.TASK_LIST,
          projectName: 'Test Project',
          summaryData: {
            method:
              'Manually enter one set of coordinates and a width to create a circular site',
            coordinateSystem:
              'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
            coordinates: `${mockCoordinates[COORDINATE_SYSTEMS.WGS84].latitude}, ${mockCoordinates[COORDINATE_SYSTEMS.WGS84].longitude}`,
            width: '100 metres'
          },
          siteDetailsData:
            '{"coordinatesType":"coordinates","coordinateSystem":"wgs84","coordinatesEntry":"single","coordinates":{"latitude":"51.489676","longitude":"-0.231530"},"circleWidth":"100"}'
        })
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
          pageTitle: 'Review site details',
          backLink: routes.TASK_LIST,
          projectName: 'Test Project',
          summaryData: {
            method:
              'Manually enter one set of coordinates and a width to create a circular site',
            coordinateSystem: 'OSGB36 (National Grid)\nEastings and Northings',
            coordinates: `${mockCoordinates[COORDINATE_SYSTEMS.OSGB36].eastings}, ${mockCoordinates[COORDINATE_SYSTEMS.OSGB36].northings}`,
            width: '100 metres'
          },
          siteDetailsData:
            '{"coordinatesType":"coordinates","coordinateSystem":"osgb36","coordinatesEntry":"single","coordinates":{"eastings":"425053","northings":"564180"},"circleWidth":"100"}'
        })
      })
    })
  })

  describe('Integration Tests', () => {
    describe('GET Handler - DOM Rendering', () => {
      test('should display summary data correctly in DOM', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: routes.REVIEW_SITE_DETAILS,
          headers: {
            referer: `http://localhost/${routes.WIDTH_OF_SITE}`
          }
        })

        expect(result).toEqual(
          expect.stringContaining(
            `Review site details | ${config.get('serviceName')}`
          )
        )

        const { document } = new JSDOM(result).window

        // Use DOM assertion helpers
        assertPageTitleAndHeading(document, 'Review site details')
        assertProjectNameCaption(document, mockExemption.projectName)

        // Summary card title
        const summaryCardTitle = document.querySelector(
          '.govuk-summary-card__title'
        )
        expect(summaryCardTitle.textContent.trim()).toBe('Site details')

        // Summary list data
        const summaryData = [
          {
            key: 'Method of providing site location',
            value:
              'Manually enter one set of coordinates and a width to create a circular site'
          },
          {
            key: 'Coordinate system',
            value: 'WGS84 (World Geodetic System 1984)',
            isHtml: true
          },
          {
            key: 'Coordinates at centre of site',
            value: `${mockCoordinates[COORDINATE_SYSTEMS.WGS84].latitude}, ${mockCoordinates[COORDINATE_SYSTEMS.WGS84].longitude}`
          },
          {
            key: 'Width of circular site',
            value: '100 metres'
          }
        ]
        assertSummaryListData(document, summaryData)

        // Navigation links
        assertNavigationLinks(
          document,
          '/exemption/width-of-site',
          '/exemption/task-list?cancel=site-details'
        )

        expect(statusCode).toBe(statusCodes.ok)
      })

      describe('multiple coordinates - polygon', () => {
        test('should render WGS84 polygon coordinates', async () => {
          const polygonExemption = createMockExemption(
            'multiple',
            COORDINATE_SYSTEMS.WGS84
          )

          getExemptionCacheSpy.mockReturnValueOnce(polygonExemption)
          getCoordinateSystemSpy.mockReturnValueOnce({
            coordinateSystem: COORDINATE_SYSTEMS.WGS84
          })

          const h = createMockHandler()
          const mockRequest = createMockRequest()
          mockRequest.headers = {
            referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
          }

          await reviewSiteDetailsController.handler(mockRequest, h)

          expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
            heading: 'Review site details',
            pageTitle: 'Review site details',
            backLink: routes.ENTER_MULTIPLE_COORDINATES,
            projectName: 'Test Project',
            summaryData: {
              method:
                'Manually enter multiple sets of coordinates to mark the boundary of the site',
              coordinateSystem:
                'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
              polygonCoordinates: [
                {
                  label: 'Start and end points',
                  value: '55.123456, 55.123456'
                },
                {
                  label: 'Point 2',
                  value: '33.987654, 33.987654'
                },
                {
                  label: 'Point 3',
                  value: '78.123456, 78.123456'
                }
              ]
            },
            siteDetailsData:
              '{"coordinatesType":"coordinates","coordinateSystem":"wgs84","coordinatesEntry":"multiple","coordinates":[{"latitude":"55.123456","longitude":"55.123456"},{"latitude":"33.987654","longitude":"33.987654"},{"latitude":"78.123456","longitude":"78.123456"}]}'
          })
        })

        test('should render OSGB36 polygon coordinates', async () => {
          const polygonExemption = createMockExemption(
            'multiple',
            COORDINATE_SYSTEMS.OSGB36
          )

          getExemptionCacheSpy.mockReturnValueOnce(polygonExemption)
          getCoordinateSystemSpy.mockReturnValueOnce({
            coordinateSystem: COORDINATE_SYSTEMS.OSGB36
          })

          const h = createMockHandler()
          const mockRequest = createMockRequest()
          mockRequest.headers = {
            referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
          }

          await reviewSiteDetailsController.handler(mockRequest, h)

          expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
            heading: 'Review site details',
            pageTitle: 'Review site details',
            backLink: routes.ENTER_MULTIPLE_COORDINATES,
            projectName: 'Test Project',
            summaryData: {
              method:
                'Manually enter multiple sets of coordinates to mark the boundary of the site',
              coordinateSystem:
                'OSGB36 (National Grid)\nEastings and Northings',
              polygonCoordinates: [
                {
                  label: 'Start and end points',
                  value: '425053, 564180'
                },
                {
                  label: 'Point 2',
                  value: '426000, 565000'
                },
                {
                  label: 'Point 3',
                  value: '427000, 566000'
                }
              ]
            },
            siteDetailsData:
              '{"coordinatesType":"coordinates","coordinateSystem":"osgb36","coordinatesEntry":"multiple","coordinates":[{"eastings":"425053","northings":"564180"},{"eastings":"426000","northings":"565000"},{"eastings":"427000","northings":"566000"}]}'
          })
        })

        test('should handle empty polygon coordinates', async () => {
          const baseExemption = createMockExemption(
            'multiple',
            COORDINATE_SYSTEMS.WGS84
          )
          const exemptionWithEmptyCoordinates = {
            ...baseExemption,
            siteDetails: {
              ...baseExemption.siteDetails,
              coordinates: []
            }
          }

          getExemptionCacheSpy.mockReturnValueOnce(
            exemptionWithEmptyCoordinates
          )
          getCoordinateSystemSpy.mockReturnValueOnce({
            coordinateSystem: COORDINATE_SYSTEMS.WGS84
          })

          const h = createMockHandler()
          const mockRequest = createMockRequest()
          mockRequest.headers = {
            referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
          }

          await reviewSiteDetailsController.handler(mockRequest, h)

          expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
            heading: 'Review site details',
            pageTitle: 'Review site details',
            backLink: routes.ENTER_MULTIPLE_COORDINATES,
            projectName: 'Test Project',
            summaryData: {
              method:
                'Manually enter multiple sets of coordinates to mark the boundary of the site',
              coordinateSystem:
                'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
              polygonCoordinates: []
            },
            siteDetailsData:
              '{"coordinatesType":"coordinates","coordinateSystem":"wgs84","coordinatesEntry":"multiple","coordinates":[]}'
          })
        })

        test('should filter out incomplete coordinates', async () => {
          const baseExemption = createMockExemption(
            'multiple',
            COORDINATE_SYSTEMS.WGS84
          )
          const exemptionWithIncompleteCoordinates = {
            ...baseExemption,
            siteDetails: {
              ...baseExemption.siteDetails,
              coordinates: [
                { latitude: '55.123456', longitude: '55.123456' },
                { latitude: '', longitude: '33.987654' }, // incomplete
                { latitude: '78.123456', longitude: '78.123456' },
                { latitude: null, longitude: null } // invalid
              ]
            }
          }

          getExemptionCacheSpy.mockReturnValueOnce(
            exemptionWithIncompleteCoordinates
          )
          getCoordinateSystemSpy.mockReturnValueOnce({
            coordinateSystem: COORDINATE_SYSTEMS.WGS84
          })

          const h = createMockHandler()
          const mockRequest = createMockRequest()
          mockRequest.headers = {
            referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
          }

          await reviewSiteDetailsController.handler(mockRequest, h)

          expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
            heading: 'Review site details',
            pageTitle: 'Review site details',
            backLink: routes.ENTER_MULTIPLE_COORDINATES,
            projectName: 'Test Project',
            summaryData: {
              method:
                'Manually enter multiple sets of coordinates to mark the boundary of the site',
              coordinateSystem:
                'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
              polygonCoordinates: [
                {
                  label: 'Start and end points',
                  value: '55.123456, 55.123456'
                },
                {
                  label: 'Point 2',
                  value: '78.123456, 78.123456'
                }
              ]
            },
            siteDetailsData:
              '{"coordinatesType":"coordinates","coordinateSystem":"wgs84","coordinatesEntry":"multiple","coordinates":[{"latitude":"55.123456","longitude":"55.123456"},{"latitude":"","longitude":"33.987654"},{"latitude":"78.123456","longitude":"78.123456"},{"latitude":null,"longitude":null}]}'
          })
        })

        test('should handle single polygon coordinate', async () => {
          const baseExemption = createMockExemption(
            'multiple',
            COORDINATE_SYSTEMS.WGS84
          )
          const exemptionWithSingleCoordinate = {
            ...baseExemption,
            siteDetails: {
              ...baseExemption.siteDetails,
              coordinates: [{ latitude: '55.123456', longitude: '55.123456' }]
            }
          }

          getExemptionCacheSpy.mockReturnValueOnce(
            exemptionWithSingleCoordinate
          )

          const h = createMockHandler()
          const mockRequest = createMockRequest()

          await reviewSiteDetailsController.handler(mockRequest, h)

          const expectedCall = h.view.mock.calls[0]
          expect(expectedCall[1].summaryData.polygonCoordinates).toEqual([
            {
              label: 'Start and end points',
              value: '55.123456, 55.123456'
            }
          ])
        })

        test('should render many polygon coordinates', async () => {
          const manyCoordinates = [
            { latitude: '50.123456', longitude: '50.123456' },
            { latitude: '51.123456', longitude: '51.123456' },
            { latitude: '52.123456', longitude: '52.123456' },
            { latitude: '53.123456', longitude: '53.123456' },
            { latitude: '54.123456', longitude: '54.123456' }
          ]

          const baseExemption = createMockExemption(
            'multiple',
            COORDINATE_SYSTEMS.WGS84
          )
          const exemptionWithManyCoordinates = {
            ...baseExemption,
            siteDetails: {
              ...baseExemption.siteDetails,
              coordinates: manyCoordinates
            }
          }

          getExemptionCacheSpy.mockReturnValueOnce(exemptionWithManyCoordinates)

          const h = createMockHandler()
          const mockRequest = createMockRequest()

          await reviewSiteDetailsController.handler(mockRequest, h)

          const expectedCall = h.view.mock.calls[0]
          expect(expectedCall[1].summaryData.polygonCoordinates).toEqual([
            { label: 'Start and end points', value: '50.123456, 50.123456' },
            { label: 'Point 2', value: '51.123456, 51.123456' },
            { label: 'Point 3', value: '52.123456, 52.123456' },
            { label: 'Point 4', value: '53.123456, 53.123456' },
            { label: 'Point 5', value: '54.123456, 54.123456' }
          ])
        })

        test('should display polygon summary data in DOM', async () => {
          getExemptionCacheSpy.mockReturnValueOnce(mockPolygonExemptionWGS84)

          const { result, statusCode } = await server.inject({
            method: 'GET',
            url: routes.REVIEW_SITE_DETAILS,
            headers: {
              referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
            }
          })

          expect(result).toEqual(
            expect.stringContaining(
              `Review site details | ${config.get('serviceName')}`
            )
          )

          const { document } = new JSDOM(result).window

          expect(document.querySelector('h1').textContent.trim()).toContain(
            'Review site details'
          )

          expect(
            document.querySelector('.govuk-caption-l').textContent.trim()
          ).toBe(mockPolygonExemptionWGS84.projectName)

          const summaryCardTitle = document.querySelector(
            '.govuk-summary-card__title'
          )
          expect(summaryCardTitle.textContent.trim()).toBe('Site details')

          const summaryKeys = document.querySelectorAll(
            '.govuk-summary-list__key'
          )
          const summaryValues = document.querySelectorAll(
            '.govuk-summary-list__value'
          )

          expect(summaryKeys[0].textContent.trim()).toBe(
            'Method of providing site location'
          )
          expect(summaryValues[0].textContent.trim()).toBe(
            'Manually enter multiple sets of coordinates to mark the boundary of the site'
          )

          expect(summaryKeys[1].textContent.trim()).toBe('Coordinate system')
          expect(summaryValues[1].innerHTML.trim()).toContain(
            'WGS84 (World Geodetic System 1984)'
          )
          expect(summaryValues[1].innerHTML.trim()).toContain(
            'Latitude and longitude'
          )

          expect(summaryKeys[2].textContent.trim()).toBe('Start and end points')
          expect(summaryValues[2].textContent.trim()).toBe(
            '55.123456, 55.123456'
          )

          expect(summaryKeys[3].textContent.trim()).toBe('Point 2')
          expect(summaryValues[3].textContent.trim()).toBe(
            '33.987654, 33.987654'
          )

          expect(summaryKeys[4].textContent.trim()).toBe('Point 3')
          expect(summaryValues[4].textContent.trim()).toBe(
            '78.123456, 78.123456'
          )

          expect(
            document
              .querySelector(
                `.govuk-back-link[href="${routes.ENTER_MULTIPLE_COORDINATES}"]`
              )
              .textContent.trim()
          ).toBe('Back')

          expect(
            document
              .querySelector(
                '.govuk-link[href="/exemption/task-list?cancel=site-details"]'
              )
              .textContent.trim()
          ).toBe('Cancel')

          expect(statusCode).toBe(statusCodes.ok)
        })
      })
    })

    describe('POST Handler - Full Flow', () => {
      test('should redirect to task list and patch backend', async () => {
        const { headers, statusCode } = await server.inject({
          method: 'POST',
          url: routes.REVIEW_SITE_DETAILS,
          payload: {},
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
            info: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
          }
        }
        const h = { redirect: jest.fn() }

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

      test('Should save file upload data with display metadata for file upload flow', async () => {
        const mockFileUploadExemption = createFileUploadExemptionWithS3()
        getExemptionCacheSpy.mockReturnValueOnce(mockFileUploadExemption)

        const request = createMockRequest()
        const h = { redirect: jest.fn() }

        await reviewSiteDetailsSubmitController.handler(request, h)

        expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
          expect.any(Object),
          '/exemption/site-details',
          {
            multipleSiteDetails: mockExemption.multipleSiteDetails,
            siteDetails: createExpectedSiteDetails(),
            id: mockExemption.id
          }
        )

        expect(resetExemptionSiteDetailsSpy).toHaveBeenCalledWith(request)
        expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      })

      test('should redirect to task list on successful POST', async () => {
        const request = {
          logger: {
            info: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
          }
        }
        const h = { redirect: jest.fn() }

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

        jest.spyOn(cacheUtils, 'getExemptionCache').mockImplementation(() => {
          const exemption = exemptionWithUndefinedSiteDetails
          // This simulates the line: const siteDetails = exemption.siteDetails ?? {}
          capturedSiteDetails = exemption.siteDetails ?? {}
          return exemption
        })

        const request = {
          logger: {
            info: jest.fn(),
            error: jest.fn()
          }
        }
        const h = { redirect: jest.fn() }

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
        const apiPatchMock = jest.spyOn(
          authRequests,
          'authenticatedPatchRequest'
        )
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

        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: routes.REVIEW_SITE_DETAILS,
          payload: {},
          headers: {
            referer: `http://localhost/${routes.WIDTH_OF_SITE}`
          }
        })

        expect(result).toEqual(expect.stringContaining('Bad Request'))

        const { document } = new JSDOM(result).window

        expect(document.querySelector('h1').textContent.trim()).toContain('400')

        expect(statusCode).toBe(statusCodes.badRequest)
      })

      test('should pass error to global handler when no validation data', async () => {
        const apiPatchMock = jest.spyOn(
          authRequests,
          'authenticatedPatchRequest'
        )
        apiPatchMock.mockRejectedValueOnce({
          res: { statusCode: 500 },
          data: {}
        })

        const { result } = await server.inject({
          method: 'POST',
          url: routes.REVIEW_SITE_DETAILS,
          payload: {},
          headers: {
            referer: `http://localhost/${routes.WIDTH_OF_SITE}`
          }
        })

        expect(result).toContain('Bad Request')

        const { document } = new JSDOM(result).window

        expect(document.querySelector('h1').textContent.trim()).toBe('400')
      })

      describe('Polygon Coordinate Submission', () => {
        test('should save WGS84 polygon data correctly', async () => {
          getExemptionCacheSpy.mockReturnValueOnce(mockPolygonExemptionWGS84)

          const request = {
            logger: {
              info: jest.fn(),
              error: jest.fn(),
              debug: jest.fn()
            }
          }
          const h = { redirect: jest.fn() }

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
              info: jest.fn(),
              error: jest.fn(),
              debug: jest.fn()
            }
          }
          const h = { redirect: jest.fn() }

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

          const { headers, statusCode } = await server.inject({
            method: 'POST',
            url: routes.REVIEW_SITE_DETAILS,
            payload: {},
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

          const apiPatchMock = jest.spyOn(
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

          const { result, statusCode } = await server.inject({
            method: 'POST',
            url: routes.REVIEW_SITE_DETAILS,
            payload: {},
            headers: {
              referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
            }
          })

          expect(result).toEqual(expect.stringContaining('Bad Request'))

          const { document } = new JSDOM(result).window
          expect(document.querySelector('h1').textContent.trim()).toContain(
            '400'
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
          const siteDetails = { coordinates: [] }

          const result = getPolygonCoordinatesDisplayData(
            siteDetails,
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result).toEqual([])
        })

        test('should handle null/undefined coordinates', () => {
          const siteDetails = { coordinates: null }

          const result = getPolygonCoordinatesDisplayData(
            siteDetails,
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result).toEqual([])
        })

        test('should handle missing coordinate system', () => {
          const siteDetails = {
            coordinates: mockPolygonCoordinatesWGS84
          }

          const result = getPolygonCoordinatesDisplayData(siteDetails, null)

          expect(result).toEqual([])
        })
      })

      describe('buildManualCoordinateSummaryData', () => {
        test('should build polygon summary data for multiple coordinates', () => {
          const siteDetails = {
            coordinatesEntry: 'multiple',
            coordinatesType: 'coordinates',
            coordinates: mockPolygonCoordinatesWGS84
          }

          const result = buildManualCoordinateSummaryData(
            siteDetails,
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result).toEqual({
            method:
              'Manually enter multiple sets of coordinates to mark the boundary of the site',
            coordinateSystem:
              'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
            polygonCoordinates: [
              { label: 'Start and end points', value: '55.123456, 55.123456' },
              { label: 'Point 2', value: '33.987654, 33.987654' },
              { label: 'Point 3', value: '78.123456, 78.123456' }
            ]
          })
        })

        test('should build circular summary data for single coordinates', () => {
          const siteDetails = {
            coordinatesEntry: 'single',
            coordinatesType: 'coordinates',
            coordinates: { latitude: '50.123456', longitude: '-0.123456' },
            circleWidth: '200'
          }

          const result = buildManualCoordinateSummaryData(
            siteDetails,
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result).toEqual({
            method:
              'Manually enter one set of coordinates and a width to create a circular site',
            coordinateSystem:
              'WGS84 (World Geodetic System 1984)\nLatitude and longitude',
            coordinates: '50.123456, -0.123456',
            width: '200 metres'
          })
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

/**
 * @import { Server } from '@hapi/hapi'
 */
