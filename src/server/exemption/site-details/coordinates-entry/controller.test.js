import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  coordinatesEntryController,
  coordinatesEntrySubmitController,
  COORDINATES_ENTRY_VIEW_ROUTE
} from '#src/server/exemption/site-details/coordinates-entry/controller.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'
import { mockExemption, mockSite } from '#src/server/test-helpers/mocks.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { config } from '#src/config/config.js'
import { JSDOM } from 'jsdom'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#coordinatesEntry', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy

  beforeEach(() => {
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  describe('#coordinatesEntryController', () => {
    test('coordinatesEntryController handler should render with correct context', () => {
      const h = { view: vi.fn() }

      coordinatesEntryController.handler(
        {
          site: mockSite
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(COORDINATES_ENTRY_VIEW_ROUTE, {
        pageTitle: 'How do you want to enter the coordinates?',
        heading: 'How do you want to enter the coordinates?',
        backLink: routes.ACTIVITY_DESCRIPTION,
        payload: {
          coordinatesEntry: mockExemption.siteDetails[0].coordinatesEntry
        },
        projectName: 'Test Project'
      })
    })

    test('coordinatesEntryController handler should render with correct context with no existing cache data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName
      })

      const h = { view: vi.fn() }

      coordinatesEntryController.handler(
        {
          site: mockSite
        },
        h
      )

      expect(h.view).toHaveBeenCalledWith(COORDINATES_ENTRY_VIEW_ROUTE, {
        pageTitle: 'How do you want to enter the coordinates?',
        heading: 'How do you want to enter the coordinates?',
        backLink: routes.ACTIVITY_DESCRIPTION,
        payload: { coordinatesEntry: undefined },
        projectName: 'Test Project'
      })
    })

    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: routes.COORDINATES_ENTRY_CHOICE,
        server: getServer()
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
            `.govuk-back-link[href="${routes.ACTIVITY_DESCRIPTION}"`
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
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
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
        backLink: routes.ACTIVITY_DESCRIPTION,
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
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
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
        backLink: routes.ACTIVITY_DESCRIPTION,
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
        redirect: vi.fn()
      }

      await coordinatesEntrySubmitController.handler(
        { payload: { coordinatesEntry: 'single' }, site: mockSite },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.COORDINATE_SYSTEM_CHOICE)
    })

    test('Should correctly set the cache when submitting', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        }),
        view: vi.fn()
      }

      const mockRequest = {
        payload: { coordinatesEntry: 'single' },
        site: mockSite
      }

      await coordinatesEntrySubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        0,
        'coordinatesEntry',
        'single'
      )
    })
  })
})
