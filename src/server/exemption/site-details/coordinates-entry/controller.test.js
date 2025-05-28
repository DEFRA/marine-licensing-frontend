import { createServer } from '~/src/server/index.js'
import {
  coordinatesEntryController,
  coordinatesEntrySubmitController,
  COORDINATES_ENTRY_VIEW_ROUTE
} from '~/src/server/exemption/site-details/coordinates-entry/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#coordinatesEntry', () => {
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

  describe('#coordinatesEntryController', () => {
    test('coordinatesEntryController handler should render with correct context', () => {
      const h = { view: jest.fn() }

      coordinatesEntryController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(COORDINATES_ENTRY_VIEW_ROUTE, {
        pageTitle: 'How do you want to enter the coordinates?',
        heading: 'How do you want to enter the coordinates?',
        backLink: routes.COORDINATES_TYPE_CHOICE,
        payload: {
          coordinatesEntry: mockExemption.siteDetails.coordinatesEntry
        },
        projectName: 'Test Project'
      })
    })

    test('coordinatesEntryController handler should render with correct context with no existing cache data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName
      })

      const h = { view: jest.fn() }

      coordinatesEntryController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(COORDINATES_ENTRY_VIEW_ROUTE, {
        pageTitle: 'How do you want to enter the coordinates?',
        heading: 'How do you want to enter the coordinates?',
        backLink: routes.COORDINATES_TYPE_CHOICE,
        payload: { coordinatesEntry: undefined },
        projectName: 'Test Project'
      })
    })

    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.COORDINATES_ENTRY_CHOICE
      })

      expect(result).toEqual(
        expect.stringContaining(
          `How do you want to enter the coordinates? | ${config.get('serviceName')}`
        )
      )

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe(
        'How do you want to enter the coordinates?'
      )

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe('Test Project')

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(mockExemption.projectName)

      expect(document.querySelector('#coordinatesEntry').value).toBe('single')

      expect(document.querySelector('#coordinatesEntry-2').value).toBe(
        'multiple'
      )

      expect(
        document
          .querySelector(
            `.govuk-back-link[href="${routes.COORDINATES_TYPE_CHOICE}"`
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

  describe('#coordinatesEntrySubmitController', () => {
    test('Should correctly format error data', () => {
      const request = {
        payload: { coordinatesEntry: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['coordinatesEntry'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      coordinatesEntrySubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(COORDINATES_ENTRY_VIEW_ROUTE, {
        pageTitle: 'How do you want to enter the coordinates?',
        heading: 'How do you want to enter the coordinates?',
        backLink: routes.COORDINATES_TYPE_CHOICE,
        projectName: 'Test Project',
        payload: { coordinatesEntry: 'invalid' },
        errorSummary: [
          {
            href: '#coordinatesEntry',
            text: 'TEST',
            field: ['coordinatesEntry']
          }
        ],
        errors: {
          coordinatesEntry: {
            field: ['coordinatesEntry'],
            href: '#coordinatesEntry',
            text: 'TEST'
          }
        }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly output page with no error data in object', () => {
      const request = {
        payload: { coordinatesEntry: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      coordinatesEntrySubmitController.options.validate.failAction(
        request,
        h,
        {}
      )

      expect(h.view).toHaveBeenCalledWith(COORDINATES_ENTRY_VIEW_ROUTE, {
        pageTitle: 'How do you want to enter the coordinates?',
        heading: 'How do you want to enter the coordinates?',
        backLink: routes.COORDINATES_TYPE_CHOICE,
        projectName: 'Test Project',
        payload: { coordinatesEntry: 'invalid' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on valid data', () => {
      const request = {
        coordinatesEntry: 'single'
      }

      const payloadValidator =
        coordinatesEntrySubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate on empty data', () => {
      const request = {}

      const payloadValidator =
        coordinatesEntrySubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error.message).toBe('COORDINATES_ENTRY_REQUIRED')
    })

    test('Should correctly validate on invalid data', () => {
      const request = { coordinatesEntry: 'invalid' }

      const payloadValidator =
        coordinatesEntrySubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error.message).toBe('COORDINATES_ENTRY_REQUIRED')
    })

    test('Should correctly navigate to next page when POST is successful', async () => {
      const h = {
        redirect: jest.fn()
      }

      await coordinatesEntrySubmitController.handler(
        { payload: { coordinatesEntry: 'single' } },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.COORDINATE_SYSTEM_CHOICE)
    })

    test('Should correctly set the cache when submitting', async () => {
      const h = {
        redirect: jest.fn().mockReturnValue({
          takeover: jest.fn()
        }),
        view: jest.fn()
      }

      const mockRequest = { payload: { coordinatesEntry: 'single' } }

      await coordinatesEntrySubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'coordinatesEntry',
        'single'
      )
    })
  })
})
