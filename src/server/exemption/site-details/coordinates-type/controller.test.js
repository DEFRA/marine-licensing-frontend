import { createServer } from '~/src/server/index.js'
import {
  coordinatesTypeController,
  coordinatesTypeSubmitController,
  PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE
} from '~/src/server/exemption/site-details/coordinates-type/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#coordinatesType', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#coordinatesTypeController', () => {
    test('coordinatesTypeController handler should render with correct context', () => {
      const h = { view: jest.fn() }

      coordinatesTypeController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to provide the site location?',
          heading: 'How do you want to provide the site location?',
          backLink: routes.SITE_DETAILS,
          payload: { coordinatesType: 'coordinates' },
          projectName: 'Test Project'
        }
      )
    })

    test('coordinatesTypeController handler should render with correct context with no existing cache data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName
      })

      const h = { view: jest.fn() }

      coordinatesTypeController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to provide the site location?',
          heading: 'How do you want to provide the site location?',
          backLink: routes.SITE_DETAILS,
          payload: { coordinatesType: undefined },
          projectName: 'Test Project'
        }
      )
    })

    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.COORDINATES_TYPE_CHOICE
      })

      expect(result).toEqual(
        expect.stringContaining(
          `How do you want to provide the site location? | ${config.get('serviceName')}`
        )
      )

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe(
        'How do you want to provide the site location?'
      )

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe('Test Project')

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(mockExemption.projectName)

      expect(document.querySelector('#coordinatesType').value).toBe('file')

      expect(document.querySelector('#coordinatesType-2').value).toBe(
        'coordinates'
      )

      expect(document.querySelector('#coordinatesType-2').checked).toBe(true)

      expect(
        document
          .querySelector('.govuk-back-link[href="/exemption/site-details"')
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

  describe('#coordinatesTypeSubmitController', () => {
    test('Should correctly format error data', () => {
      const request = {
        payload: { coordinatesType: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['coordinatesType'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      coordinatesTypeSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(
        PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to provide the site location?',
          heading: 'How do you want to provide the site location?',
          projectName: 'Test Project',
          payload: { coordinatesType: 'invalid' },
          backLink: routes.SITE_DETAILS,
          errorSummary: [
            {
              href: '#coordinatesType',
              text: 'TEST',
              field: ['coordinatesType']
            }
          ],
          errors: {
            coordinatesType: {
              field: ['coordinatesType'],
              href: '#coordinatesType',
              text: 'TEST'
            }
          }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly output page with no error data in object', () => {
      const request = {
        payload: { coordinatesType: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      coordinatesTypeSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )

      expect(h.view).toHaveBeenCalledWith(
        PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE,
        {
          backLink: routes.SITE_DETAILS,
          pageTitle: 'How do you want to provide the site location?',
          heading: 'How do you want to provide the site location?',
          projectName: 'Test Project',
          payload: { coordinatesType: 'invalid' }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on valid data', () => {
      const request = {
        coordinatesType: 'file'
      }

      const payloadValidator =
        coordinatesTypeSubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate on empty data', () => {
      const request = {}

      const payloadValidator =
        coordinatesTypeSubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error.message).toBe('PROVIDE_COORDINATES_CHOICE_REQUIRED')
    })

    test('Should correctly validate on invalid data', () => {
      const request = { coordinatesType: 'invalid' }

      const payloadValidator =
        coordinatesTypeSubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error.message).toBe('PROVIDE_COORDINATES_CHOICE_REQUIRED')
    })

    test('Should correctly redirect when file option is selected', async () => {
      const h = {
        view: jest.fn(),
        redirect: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      await coordinatesTypeSubmitController.handler(
        { payload: { coordinatesType: 'file' } },
        h
      )

      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(routes.CHOOSE_FILE_UPLOAD_TYPE)
    })

    test('Should correctly redirect to coordinates entry page when coordinates option is selected', async () => {
      const h = {
        view: jest.fn(),
        redirect: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      await coordinatesTypeSubmitController.handler(
        { payload: { coordinatesType: 'coordinates' } },
        h
      )

      expect(h.view).not.toHaveBeenCalled()

      expect(h.redirect).toHaveBeenCalledWith(routes.MULTIPLE_SITES_CHOICE)
      expect(h.redirect().takeover).toHaveBeenCalled()
    })

    test('Should correctly set the cache when submitting', async () => {
      const h = {
        redirect: jest.fn().mockReturnValue({
          takeover: jest.fn()
        }),
        view: jest.fn()
      }

      const mockRequest = { payload: { coordinatesType: 'file' } }

      await coordinatesTypeSubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        0,
        'coordinatesType',
        'file'
      )
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
