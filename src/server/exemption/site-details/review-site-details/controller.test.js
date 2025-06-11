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
import Wreck from '@hapi/wreck'

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

    jest.spyOn(Wreck, 'patch').mockReturnValue({
      payload: {
        id: mockExemption.id,
        siteDetails: mockExemption.siteDetails
      }
    })

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

    test('reviewSiteDetailsController handler should render with correct context for WGS84', () => {
      const h = { view: jest.fn() }

      reviewSiteDetailsController.handler({}, h)

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
          .querySelector('.govuk-back-link[href="/exemption/width-of-site')
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
    test('Should redirect to task list and call backend API for PATCH request', async () => {
      const { headers, statusCode } = await server.inject({
        method: 'POST',
        url: routes.REVIEW_SITE_DETAILS,
        payload: {},
        headers: {
          referer: `http://localhost/${routes.WIDTH_OF_SITE}`
        }
      })

      expect(Wreck.patch).toHaveBeenCalledWith(
        `${config.get('backend').apiUrl}/exemption/site-details`,
        {
          payload: {
            siteDetails: mockExemption.siteDetails,
            id: mockExemption.id
          },
          json: true
        }
      )

      expect(headers.location).toBe(routes.TASK_LIST)
      expect(statusCode).toBe(statusCodes.redirect)
    })

    test('Should redirect to task list for successful POST request', async () => {
      const request = {}
      const h = { redirect: jest.fn() }

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
    })

    test('Should show error page with validation errors from backend', async () => {
      const apiPatchMock = jest.spyOn(Wreck, 'patch')
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
      const apiPatchMock = jest.spyOn(Wreck, 'patch')
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
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
