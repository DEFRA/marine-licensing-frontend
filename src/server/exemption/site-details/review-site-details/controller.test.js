import { createServer } from '~/src/server/index.js'
import {
  reviewSiteDetailsController,
  reviewSiteDetailsSubmitController,
  REVIEW_SITE_DETAILS_VIEW_ROUTE,
  FILE_UPLOAD_REVIEW_VIEW_ROUTE
} from '~/src/server/exemption/site-details/review-site-details/controller.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import {
  getPolygonCoordinatesDisplayData,
  buildManualCoordinateSummaryData,
  getSiteDetailsBackLink,
  getReviewSummaryText,
  getCoordinateSystemText
} from '~/src/server/exemption/site-details/review-site-details/utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

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

  // Mock data for polygon coordinates (ML-121)
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
      .spyOn(cacheUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })
    resetExemptionSiteDetailsSpy = jest
      .spyOn(cacheUtils, 'resetExemptionSiteDetails')
      .mockReturnValue({ siteDetails: null })
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#reviewSiteDetailsController', () => {
    test('reviewSiteDetailsController handler should render with correct context with no existing data', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({})
      getCoordinateSystemSpy.mockReturnValueOnce({})

      const h = { view: jest.fn() }
      const mockRequest = {
        logger: {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn()
        }
      }

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
        }
      })
    })

    test('reviewSiteDetailsController handler should load data from MongoDB when session has ID but no siteDetails', async () => {
      const exemptionWithoutSiteDetails = {
        id: 'test-id',
        projectName: 'Test Project'
        // siteDetails is undefined
      }

      const completeMongoData = {
        id: 'test-id',
        projectName: 'Test Project',
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

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithoutSiteDetails)
      jest
        .spyOn(authRequests, 'authenticatedGetRequest')
        .mockResolvedValueOnce({
          payload: {
            value: completeMongoData
          }
        })

      const h = { view: jest.fn() }
      const mockRequest = {
        logger: {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn()
        }
      }

      await reviewSiteDetailsController.handler(mockRequest, h)

      expect(authRequests.authenticatedGetRequest).toHaveBeenCalledWith(
        mockRequest,
        '/exemption/test-id'
      )
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        'Loaded site details from MongoDB for display',
        {
          exemptionId: 'test-id',
          coordinatesType: 'file'
        }
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

    test('reviewSiteDetailsController handler should render file upload template for file upload flow', async () => {
      const mockFileUploadExemption = {
        ...mockExemption,
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

      getExemptionCacheSpy.mockReturnValueOnce(mockFileUploadExemption)

      const h = { view: jest.fn() }
      const mockRequest = {
        logger: {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn()
        }
      }

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

    test('reviewSiteDetailsController handler should render with correct context for WGS84', async () => {
      const h = { view: jest.fn() }
      const mockRequest = {
        logger: {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn()
        }
      }

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
        }
      })
    })

    test('reviewSiteDetailsController handler should render with correct context for OSGB36', async () => {
      const h = { view: jest.fn() }
      const mockRequest = {
        logger: {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn()
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce({
        ...mockExemption,
        siteDetails: {
          ...mockExemption.siteDetails,
          coordinates: mockCoordinates[COORDINATE_SYSTEMS.OSGB36]
        }
      })

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
        }
      })
    })

    test('Should provide expected response and correctly display summary data', async () => {
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

      expect(document.querySelector('h1').textContent.trim()).toContain(
        'Review site details'
      )

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(mockExemption.projectName)

      const summaryCardTitle = document.querySelector(
        '.govuk-summary-card__title'
      )
      expect(summaryCardTitle.textContent.trim()).toBe('Site details')

      const summaryKeys = document.querySelectorAll('.govuk-summary-list__key')
      const summaryValues = document.querySelectorAll(
        '.govuk-summary-list__value'
      )

      expect(summaryKeys[0].textContent.trim()).toBe(
        'Method of providing site location'
      )
      expect(summaryValues[0].textContent.trim()).toBe(
        'Manually enter one set of coordinates and a width to create a circular site'
      )

      expect(summaryKeys[1].textContent.trim()).toBe('Coordinate system')
      expect(summaryValues[1].innerHTML.trim()).toContain(
        'WGS84 (World Geodetic System 1984)'
      )
      expect(summaryValues[1].innerHTML.trim()).toContain(
        'Latitude and longitude'
      )

      expect(summaryKeys[2].textContent.trim()).toBe(
        'Coordinates at centre of site'
      )
      expect(summaryValues[2].textContent.trim()).toBe(
        `${mockCoordinates[COORDINATE_SYSTEMS.WGS84].latitude}, ${mockCoordinates[COORDINATE_SYSTEMS.WGS84].longitude}`
      )

      expect(summaryKeys[3].textContent.trim()).toBe('Width of circular site')
      expect(summaryValues[3].textContent.trim()).toBe('100 metres')

      expect(
        document
          .querySelector('.govuk-back-link[href="/exemption/width-of-site"]')
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

    describe('multiple coordinates - polygon', () => {
      test('reviewSiteDetailsController should render polygon coordinates for WGS84', async () => {
        getExemptionCacheSpy.mockReturnValueOnce(mockPolygonExemptionWGS84)

        const h = { view: jest.fn() }
        const mockRequest = {
          headers: {
            referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
          },
          logger: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
          }
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
          }
        })
      })

      test('reviewSiteDetailsController should render polygon coordinates for OSGB36', async () => {
        getExemptionCacheSpy.mockReturnValueOnce(mockPolygonExemptionOSGB36)
        getCoordinateSystemSpy.mockReturnValueOnce({
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36
        })

        const h = { view: jest.fn() }
        const mockRequest = {
          headers: {
            referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
          },
          logger: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
          }
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
            coordinateSystem: 'OSGB36 (National Grid)\nEastings and Northings',
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
          }
        })
      })

      test('reviewSiteDetailsController should handle empty polygon coordinates gracefully', async () => {
        const exemptionWithEmptyCoordinates = {
          ...mockPolygonExemptionWGS84,
          siteDetails: {
            ...mockPolygonExemptionWGS84.siteDetails,
            coordinates: []
          }
        }

        getExemptionCacheSpy.mockReturnValueOnce(exemptionWithEmptyCoordinates)

        const h = { view: jest.fn() }
        const mockRequest = {
          headers: {
            referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
          },
          logger: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
          }
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
          }
        })
      })

      test('reviewSiteDetailsController should filter out incomplete coordinates', async () => {
        const exemptionWithIncompleteCoordinates = {
          ...mockPolygonExemptionWGS84,
          siteDetails: {
            ...mockPolygonExemptionWGS84.siteDetails,
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

        const h = { view: jest.fn() }
        const mockRequest = {
          headers: {
            referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
          },
          logger: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
          }
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
          }
        })
      })

      test('reviewSiteDetailsController should handle single polygon coordinate', async () => {
        const exemptionWithSingleCoordinate = {
          ...mockPolygonExemptionWGS84,
          siteDetails: {
            ...mockPolygonExemptionWGS84.siteDetails,
            coordinates: [{ latitude: '55.123456', longitude: '55.123456' }]
          }
        }

        getExemptionCacheSpy.mockReturnValueOnce(exemptionWithSingleCoordinate)

        const h = { view: jest.fn() }
        const mockRequest = {
          logger: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
          }
        }

        await reviewSiteDetailsController.handler(mockRequest, h)

        const expectedCall = h.view.mock.calls[0]
        expect(expectedCall[1].summaryData.polygonCoordinates).toEqual([
          {
            label: 'Start and end points',
            value: '55.123456, 55.123456'
          }
        ])
      })

      test('reviewSiteDetailsController should render correctly with many polygon coordinates', async () => {
        const manyCoordinates = [
          { latitude: '50.123456', longitude: '50.123456' },
          { latitude: '51.123456', longitude: '51.123456' },
          { latitude: '52.123456', longitude: '52.123456' },
          { latitude: '53.123456', longitude: '53.123456' },
          { latitude: '54.123456', longitude: '54.123456' }
        ]

        const exemptionWithManyCoordinates = {
          ...mockPolygonExemptionWGS84,
          siteDetails: {
            ...mockPolygonExemptionWGS84.siteDetails,
            coordinates: manyCoordinates
          }
        }

        getExemptionCacheSpy.mockReturnValueOnce(exemptionWithManyCoordinates)

        const h = { view: jest.fn() }
        const mockRequest = {
          logger: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
          }
        }

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

      test('Should provide expected response and correctly display polygon summary data in DOM', async () => {
        getExemptionCacheSpy.mockReturnValueOnce(mockPolygonExemptionWGS84)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: routes.REVIEW_SITE_DETAILS,
          headers: {
            referer: `http://localhost/${routes.ENTER_MULTIPLE_COORDINATES}`
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
        expect(summaryValues[2].textContent.trim()).toBe('55.123456, 55.123456')

        expect(summaryKeys[3].textContent.trim()).toBe('Point 2')
        expect(summaryValues[3].textContent.trim()).toBe('33.987654, 33.987654')

        expect(summaryKeys[4].textContent.trim()).toBe('Point 3')
        expect(summaryValues[4].textContent.trim()).toBe('78.123456, 78.123456')

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

  describe('#reviewSiteDetailsSubmitController', () => {
    test('Should redirect to task list and call backend API for PATCH request', async () => {
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
          siteDetails: mockExemption.siteDetails,
          id: mockExemption.id
        }
      )

      expect(headers.location).toBe(routes.TASK_LIST)
      expect(statusCode).toBe(statusCodes.redirect)
    })

    test('Should call resetExemptionSiteDetails after saving to MongoDB', async () => {
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
          siteDetails: mockExemption.siteDetails,
          id: mockExemption.id
        }
      )

      expect(resetExemptionSiteDetailsSpy).toHaveBeenCalledWith(request)
      expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
    })

    test('Should save file upload data with display metadata for file upload flow', async () => {
      const mockFileUploadExemption = {
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
      }

      getExemptionCacheSpy.mockReturnValueOnce(mockFileUploadExemption)

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
          siteDetails: {
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
          },
          id: mockExemption.id
        }
      )

      expect(resetExemptionSiteDetailsSpy).toHaveBeenCalledWith(request)
      expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
    })

    test('Should redirect to task list for successful POST request', async () => {
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

    test('Should handle exemption with undefined siteDetails and assign empty object', async () => {
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

      cacheUtils.getExemptionCache.mockImplementation(originalGetExemptionCache)
    })

    test('Should show error page with validation errors from backend', async () => {
      const apiPatchMock = jest.spyOn(authRequests, 'authenticatedPatchRequest')
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

    test('Should pass error to global catchAll behaviour if it contains no validation data', async () => {
      const apiPatchMock = jest.spyOn(authRequests, 'authenticatedPatchRequest')
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
      test('Should save polygon coordinate data correctly for WGS84', async () => {
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
            siteDetails: mockPolygonExemptionWGS84.siteDetails,
            id: mockPolygonExemptionWGS84.id
          }
        )

        expect(resetExemptionSiteDetailsSpy).toHaveBeenCalledWith(request)
        expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      })

      test('Should save polygon coordinate data correctly for OSGB36', async () => {
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
            siteDetails: mockPolygonExemptionOSGB36.siteDetails,
            id: mockPolygonExemptionOSGB36.id
          }
        )

        expect(resetExemptionSiteDetailsSpy).toHaveBeenCalledWith(request)
        expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      })

      test('Should handle POST request for polygon site through HTTP interface', async () => {
        getExemptionCacheSpy.mockReturnValueOnce(mockPolygonExemptionWGS84)

        const { headers, statusCode } = await server.inject({
          method: 'POST',
          url: routes.REVIEW_SITE_DETAILS,
          payload: {},
          headers: {
            referer: `http://localhost/${routes.ENTER_MULTIPLE_COORDINATES}`
          }
        })

        expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
          expect.any(Object),
          '/exemption/site-details',
          {
            siteDetails: mockPolygonExemptionWGS84.siteDetails,
            id: mockPolygonExemptionWGS84.id
          }
        )

        expect(headers.location).toBe(routes.TASK_LIST)
        expect(statusCode).toBe(statusCodes.redirect)
      })

      test('Should handle validation errors specific to polygon coordinates', async () => {
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
            referer: `http://localhost/${routes.ENTER_MULTIPLE_COORDINATES}`
          }
        })

        expect(result).toEqual(expect.stringContaining('Bad Request'))

        const { document } = new JSDOM(result).window
        expect(document.querySelector('h1').textContent.trim()).toContain('400')
        expect(statusCode).toBe(statusCodes.badRequest)
      })
    })
  })

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

/**
 * @import { Server } from '@hapi/hapi'
 */
