import { createServer } from '~/src/server/index.js'
import {
  centreCoordinatesController,
  centreCoordinatesSubmitController,
  COORDINATE_SYSTEM_VIEW_ROUTES,
  centreCoordinatesSubmitFailHandler
} from '~/src/server/exemption/site-details/centre-coordinates/controller.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import * as coordinateUtils from '~/src/server/common/helpers/coordinate-utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#centreCoordinates', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy
  let getCoordinateSystemSpy

  const mockCoordinates = {
    [COORDINATE_SYSTEMS.WGS84]: {
      latitude: mockExemption.siteDetails.coordinates.latitude,
      longitude: mockExemption.siteDetails.coordinates.longitude
    },
    [COORDINATE_SYSTEMS.OSGB36]: { eastings: '425053', northings: '564180' }
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
    getCoordinateSystemSpy = jest
      .spyOn(coordinateUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#centreCoordinatesController', () => {
    test('centreCoordinatesController handler should render with correct context with no existing data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({})
      const h = { view: jest.fn() }

      centreCoordinatesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          payload: { latitude: undefined, longitude: undefined },
          projectName: undefined
        }
      )
    })

    test('centreCoordinatesController handler should render with correct context for wgs84', () => {
      const h = { view: jest.fn() }

      centreCoordinatesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          payload: { ...mockCoordinates[COORDINATE_SYSTEMS.WGS84] },
          projectName: 'Test Project'
        }
      )
    })

    test('centreCoordinatesController handler should render with correct context for osgb36', () => {
      const h = { view: jest.fn() }

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

      centreCoordinatesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        {
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          payload: { ...mockCoordinates[COORDINATE_SYSTEMS.OSGB36] },
          projectName: 'Test Project'
        }
      )
    })

    test('centreCoordinatesController handler should render with correct context with existing cache data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        siteDetails: {
          ...mockExemption.siteDetails,
          coordinates: mockCoordinates[COORDINATE_SYSTEMS.WGS84]
        }
      })

      const h = { view: jest.fn() }

      centreCoordinatesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          payload: { ...mockCoordinates[COORDINATE_SYSTEMS.WGS84] },
          projectName: 'Test Project'
        }
      )
    })

    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.CIRCLE_CENTRE_POINT
      })

      expect(result).toEqual(
        expect.stringContaining(
          `Enter the coordinates at the centre point of the site | ${config.get('serviceName')}`
        )
      )

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toContain(
        'Enter the coordinates at the centre point of the site'
      )

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(mockExemption.projectName)

      expect(document.querySelector('#latitude').value).toBe(
        mockCoordinates[COORDINATE_SYSTEMS.WGS84].latitude
      )
      expect(document.querySelector('#longitude').value).toBe(
        mockCoordinates[COORDINATE_SYSTEMS.WGS84].longitude
      )

      const hintSummary = document.querySelector('.govuk-details__summary-text')
      expect(hintSummary.textContent.trim()).toBe(
        'Help with latitude and longitude formats'
      )

      expect(
        document
          .querySelector(
            '.govuk-back-link[href="/exemption/what-coordinate-system'
          )
          .textContent.trim()
      ).toBe('Back')

      expect(
        document
          .querySelector(
            '.govuk-link[href="/exemption/task-list?cancel=site-details"'
          )
          .textContent.trim()
      ).toBe('Cancel')

      expect(statusCode).toBe(statusCodes.ok)
    })
  })

  describe('#centreCoordinatesSubmitController', () => {
    test('Should correctly format error data', () => {
      const request = {
        payload: { latitude: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['latitude'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      centreCoordinatesSubmitFailHandler(
        request,
        h,
        err,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          projectName: 'Test Project',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          payload: { latitude: 'invalid' },
          errorSummary: [
            {
              href: '#latitude',
              text: 'TEST',
              field: ['latitude']
            }
          ],
          errors: {
            latitude: {
              field: ['latitude'],
              href: '#latitude',
              text: 'TEST'
            }
          }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should still render page if no error details are provided', () => {
      const request = {
        payload: {
          ...mockCoordinates[COORDINATE_SYSTEMS.WGS84],
          latitude: 'invalid'
        }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {}

      centreCoordinatesSubmitFailHandler(
        request,
        h,
        err,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          projectName: 'Test Project',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          payload: {
            ...mockCoordinates[COORDINATE_SYSTEMS.WGS84],
            latitude: 'invalid'
          }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly set the cache when submitting wgs84 data', async () => {
      const h = {
        redirect: jest.fn()
      }

      const mockRequest = {
        payload: mockExemption.siteDetails.coordinates
      }

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })

      await centreCoordinatesSubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'coordinates',
        mockExemption.siteDetails.coordinates
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.WIDTH_OF_SITE)
    })

    test('Should correctly set the cache when submitting OSGB36 data', async () => {
      const h = {
        redirect: jest.fn()
      }

      const mockRequest = {
        payload: mockCoordinates[COORDINATE_SYSTEMS.OSGB36]
      }

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      await centreCoordinatesSubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'coordinates',
        mockCoordinates[COORDINATE_SYSTEMS.OSGB36]
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.WIDTH_OF_SITE)
    })

    test('Should correctly handle validation errors', () => {
      const request = {
        payload: { latitude: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      centreCoordinatesSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          payload: request.payload
        })
      )

      expect(h.view().takeover).toHaveBeenCalled()
      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })
  })
})
