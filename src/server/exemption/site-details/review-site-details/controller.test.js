import { createServer } from '~/src/server/index.js'
import {
  reviewSiteDetailsController,
  reviewSiteDetailsSubmitController,
  REVIEW_SITE_DETAILS_VIEW_ROUTE
} from '~/src/server/exemption/site-details/review-site-details/controller.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#reviewSiteDetails', () => {
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
      .spyOn(cacheUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#reviewSiteDetailsController', () => {
    test('reviewSiteDetailsController handler should render with correct context with no existing data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({})
      getCoordinateSystemSpy.mockReturnValueOnce({})

      const h = { view: jest.fn() }

      reviewSiteDetailsController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
        heading: 'Review site details',
        pageTitle: 'Review site details',
        backLink: routes.CIRCLE_CENTRE_POINT,
        projectName: undefined,
        summaryData: {
          method: '',
          coordinateSystem: '',
          coordinates: '',
          width: ''
        }
      })
    })

    test('reviewSiteDetailsController handler should render with correct context for WGS84', () => {
      const h = { view: jest.fn() }

      reviewSiteDetailsController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
        heading: 'Review site details',
        pageTitle: 'Review site details',
        backLink: routes.CIRCLE_CENTRE_POINT,
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

    test('reviewSiteDetailsController handler should render with correct context for OSGB36', () => {
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

      reviewSiteDetailsController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
        heading: 'Review site details',
        pageTitle: 'Review site details',
        backLink: routes.CIRCLE_CENTRE_POINT,
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
        url: routes.REVIEW_SITE_DETAILS
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
          .querySelector(
            '.govuk-back-link[href="/exemption/enter-the-coordinates-at-the-centre-point'
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

  describe('#reviewSiteDetailsSubmitController', () => {
    test('Should re-render the same page for POST request', () => {
      const request = {}
      const h = { view: jest.fn() }

      reviewSiteDetailsSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
        heading: 'Review site details',
        pageTitle: 'Review site details',
        backLink: routes.CIRCLE_CENTRE_POINT,
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

    test('Should handle POST request correctly', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.REVIEW_SITE_DETAILS,
        payload: {}
      })

      expect(result).toEqual(
        expect.stringContaining(
          `Review site details | ${config.get('serviceName')}`
        )
      )

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
