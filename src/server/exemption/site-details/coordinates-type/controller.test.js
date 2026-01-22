import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  coordinatesTypeController,
  coordinatesTypeSubmitController,
  PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE
} from '#src/server/exemption/site-details/coordinates-type/controller.js'
import * as cacheUtils from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import {
  mockExemption,
  mockSite
} from '#src/server/test-helpers/mocks/exemption.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { JSDOM } from 'jsdom'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')

describe('#coordinatesType', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy

  beforeEach(() => {
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  describe('#coordinatesTypeController', () => {
    test('coordinatesTypeController handler should render with correct context', () => {
      const h = { view: vi.fn() }

      coordinatesTypeController.handler({ site: mockSite }, h)

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

      const h = { view: vi.fn() }

      coordinatesTypeController.handler({ site: mockSite }, h)

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
      const { result, statusCode } = await makeGetRequest({
        url: routes.COORDINATES_TYPE_CHOICE,
        server: getServer()
      })

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
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
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
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
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
        view: vi.fn(),
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      await coordinatesTypeSubmitController.handler(
        {
          payload: { coordinatesType: 'file' },
          site: mockSite
        },
        h
      )

      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(routes.CHOOSE_FILE_UPLOAD_TYPE)
    })

    test('Should correctly redirect to coordinates entry page when coordinates option is selected', async () => {
      const h = {
        view: vi.fn(),
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      await coordinatesTypeSubmitController.handler(
        {
          payload: { coordinatesType: 'coordinates' },
          site: mockSite
        },
        h
      )

      expect(h.view).not.toHaveBeenCalled()

      expect(h.redirect).toHaveBeenCalledWith(routes.MULTIPLE_SITES_CHOICE)
      expect(h.redirect().takeover).toHaveBeenCalled()
    })

    test('Should correctly set the cache when submitting', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        }),
        view: vi.fn()
      }

      const mockRequest = {
        payload: { coordinatesType: 'file' },
        site: mockSite
      }

      await coordinatesTypeSubmitController.handler(mockRequest, h)

      expect(cacheUtils.resetExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        h
      )

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        h,
        0,
        'coordinatesType',
        'file'
      )
    })

    test('Should correctly set the cache when submitting without clearing when there is no change', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        }),
        view: vi.fn()
      }

      const mockExemptionWithNoChange = { ...mockExemption }
      mockExemptionWithNoChange.siteDetails[0].coordinatesType = 'file'
      getExemptionCacheSpy.mockReturnValue(mockExemptionWithNoChange)

      const mockRequest = {
        payload: { coordinatesType: 'file' },
        site: mockSite
      }

      await coordinatesTypeSubmitController.handler(mockRequest, h)

      expect(cacheUtils.resetExemptionSiteDetails).not.toHaveBeenCalled()

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        h,
        0,
        'coordinatesType',
        'file'
      )
    })

    test('Should correctly set the cache when submitting after reset', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        }),
        view: vi.fn()
      }

      const mockExemptionFromReset = {
        ...mockExemption,
        siteDetails: [],
        multipleSiteDetails: {}
      }
      getExemptionCacheSpy.mockReturnValue(mockExemptionFromReset)

      const mockRequest = {
        payload: { coordinatesType: 'file' },
        site: mockSite
      }

      await coordinatesTypeSubmitController.handler(mockRequest, h)

      expect(cacheUtils.resetExemptionSiteDetails).not.toHaveBeenCalled()

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        h,
        0,
        'coordinatesType',
        'file'
      )
    })
  })
})
