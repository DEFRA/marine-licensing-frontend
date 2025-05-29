import { createServer } from '~/src/server/index.js'
import {
  coordinateSystemController,
  coordinateSystemSubmitController,
  COORDINATE_SYSTEM_VIEW_ROUTE
} from '~/src/server/exemption/site-details/coordinate-system/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#coordinateSystem', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#coordinateSystemController', () => {
    test('coordinateSystemController handler should render with correct context with no existing data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({})
      const h = { view: jest.fn() }

      coordinateSystemController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        backLink: routes.COORDINATES_ENTRY_CHOICE,
        payload: { coordinateSystem: undefined },
        projectName: undefined
      })
    })

    test('coordinateSystemController handler should render with correct context', () => {
      const h = { view: jest.fn() }

      coordinateSystemController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        backLink: routes.COORDINATES_ENTRY_CHOICE,
        payload: { coordinateSystem: 'osgb36' },
        projectName: 'Test Project'
      })
    })

    test('coordinateSystemController handler should render with correct context with existing cache data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        siteDetails: {
          coordinateSystem: 'wgs84'
        }
      })

      const h = { view: jest.fn() }

      coordinateSystemController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        backLink: routes.COORDINATES_ENTRY_CHOICE,
        payload: { coordinateSystem: 'wgs84' },
        projectName: 'Test Project'
      })
    })

    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.COORDINATE_SYSTEM_CHOICE
      })

      expect(result).toEqual(
        expect.stringContaining(
          `Which coordinate system do you want to use? | ${config.get('serviceName')}`
        )
      )

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe(
        'Which coordinate system do you want to use?'
      )

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe('Test Project')

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(mockExemption.projectName)

      expect(document.querySelector('#coordinateSystem').value).toBe('wgs84')
      expect(document.querySelector('#coordinateSystem-2').value).toBe('osgb36')

      const hint = document.querySelector('.govuk-hint')
      expect(hint.hasAttribute('open')).toBe(false)
      expect(hint.innerHTML).toContain(
        '<h2 class="govuk-heading-s">WGS84 (World Geodetic System 1984)</h2>'
      )
      expect(hint.innerHTML).toContain(
        '<h2 class="govuk-heading-s">OSGB36 (National Grid)</h2>'
      )

      const hintSummary = document.querySelector('.govuk-details__summary-text')
      expect(hintSummary.textContent.trim()).toBe(
        'Help with the coordinate systems'
      )

      expect(
        document
          .querySelector(
            '.govuk-back-link[href="/exemption/how-do-you-want-to-enter-the-coordinates"'
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

  describe('#coordinateSystemSubmitController', () => {
    test('Should correctly format error data', () => {
      const request = {
        payload: { coordinateSystem: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['coordinateSystem'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      coordinateSystemSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        projectName: 'Test Project',
        backLink: routes.COORDINATES_ENTRY_CHOICE,
        payload: { coordinateSystem: 'invalid' },
        errorSummary: [
          {
            href: '#coordinateSystem',
            text: 'TEST',
            field: ['coordinateSystem']
          }
        ],
        errors: {
          coordinateSystem: {
            field: ['coordinateSystem'],
            href: '#coordinateSystem',
            text: 'TEST'
          }
        }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should still render page if no error details are provided', () => {
      const request = {
        payload: { coordinateSystem: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {}

      coordinateSystemSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        projectName: 'Test Project',
        backLink: routes.COORDINATES_ENTRY_CHOICE,
        payload: { coordinateSystem: 'invalid' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on valid data', () => {
      const request = {
        coordinateSystem: 'wgs84'
      }

      const payloadValidator =
        coordinateSystemSubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate on empty data', () => {
      const request = {}

      const payloadValidator =
        coordinateSystemSubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error.message).toBe('COORDINATE_SYSTEM_REQUIRED')
    })

    test('Should correctly validate on invalid data', () => {
      const request = { coordinateSystem: 'invalid' }

      const payloadValidator =
        coordinateSystemSubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error.message).toBe('COORDINATE_SYSTEM_REQUIRED')
    })

    test('Should correctly set the cache when submitting', async () => {
      const h = {
        view: jest.fn()
      }

      const mockRequest = { payload: { coordinateSystem: 'wgs84' } }

      await coordinateSystemSubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'coordinateSystem',
        'wgs84'
      )
    })
  })
})
