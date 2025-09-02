import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import {
  activityDescriptionController,
  activityDescriptionSubmitController,
  ACTIVITY_DESCRIPTION_VIEW_ROUTE
} from '~/src/server/exemption/activity-description/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#activityDescriptionController', () => {
  let server
  let getExemptionCacheSpy
  const request = { url: {} }

  const mockExemptionState = {}

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest
      .spyOn(authRequests, 'authenticatedPatchRequest')
      .mockResolvedValue({ payload: { id: mockExemption.id } })

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionState)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('activityDescriptionController GET', () => {
    test('should render the activity description page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.ACTIVITY_DESCRIPTION
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toEqual(
        expect.stringContaining(
          `Activity description | ${config.get('serviceName')}`
        )
      )

      const { document } = new JSDOM(result).window
      expect(
        document
          .querySelector('label[for="activityDescription"]')
          .textContent.trim()
      ).toBe('Activity description')
      expect(document.querySelector('#activityDescription').value).toBe('')
      expect(document.querySelector('form').method).toBe('post')
      expect(
        document.querySelector('button[type="submit"]').textContent.trim()
      ).toBe('Save and continue')
    })

    test('handler should render with correct context', () => {
      const h = { view: jest.fn() }

      activityDescriptionController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
        backLink: routes.TASK_LIST,
        isSiteDetailsFlow: false,
        pageTitle: 'Activity description',
        heading: 'Activity description',
        payload: { activityDescription: undefined }
      })

      getExemptionCacheSpy.mockResolvedValueOnce(null)

      activityDescriptionController.handler(request, h)

      expect(h.view).toHaveBeenNthCalledWith(
        2,
        ACTIVITY_DESCRIPTION_VIEW_ROUTE,
        {
          backLink: routes.TASK_LIST,
          isSiteDetailsFlow: false,
          pageTitle: 'Activity description',
          heading: 'Activity description',
          payload: { activityDescription: undefined }
        }
      )
    })

    test('handler should render with correct context for site details flow', () => {
      const h = { view: jest.fn() }
      const request = {
        url: { pathname: routes.SITE_DETAILS_ACTIVITY_DESCRIPTION }
      }
      const exemptionWithSiteDetails = {
        ...mockExemptionState,
        siteDetails: {
          activityDescription: 'Site activity description'
        }
      }

      getExemptionCacheSpy.mockReturnValue(exemptionWithSiteDetails)

      activityDescriptionController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
        backLink: routes.SITE_DETAILS_ACTIVITY_DATES,
        isSiteDetailsFlow: true,
        pageTitle: 'Activity description',
        heading: 'Activity description',
        payload: { activityDescription: 'Site activity description' }
      })
    })
  })

  describe('activityDescriptionController POST', () => {
    test('should handle form submission with valid data', async () => {
      const apiPatchMock = jest.spyOn(authRequests, 'authenticatedPatchRequest')
      const payload = {
        activityDescription: 'This is a test activity description.'
      }

      apiPatchMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { data: 'test' }
      })

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DESCRIPTION,
        payload
      })

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/exemption/activity-description',
        { ...payload }
      )
      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(routes.TASK_LIST)
    })

    test('should call updateExemptionSiteDetails when in site details flow', async () => {
      const mockedUpdateExemptionSiteDetails = jest.mocked(
        cacheUtils.updateExemptionSiteDetails
      )

      const exemptionWithSiteDetails = {
        ...mockExemption,
        multipleSiteDetails: { multipleSitesEnabled: false },
        siteDetails: {
          activityDescription: 'Existing site activity description'
        }
      }

      getExemptionCacheSpy.mockReturnValue(exemptionWithSiteDetails)

      const payload = {
        activityDescription: 'New site activity description.'
      }

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: routes.SITE_DETAILS_ACTIVITY_DESCRIPTION,
        payload
      })

      expect(mockedUpdateExemptionSiteDetails).toHaveBeenCalledWith(
        expect.any(Object),
        'activityDescription',
        'New site activity description.'
      )
      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(routes.COORDINATES_ENTRY_CHOICE)
    })

    test('should handle form submission with empty activity description', async () => {
      const payload = {
        activityDescription: ''
      }

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DESCRIPTION,
        payload
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toEqual(
        expect.stringContaining(
          `Activity description | ${config.get('serviceName')}`
        )
      )

      const { document } = new JSDOM(result).window
      expect(
        document
          .querySelector('label[for="activityDescription"]')
          .textContent.trim()
      ).toBe('Activity description')
      expect(document.querySelector('#activityDescription').value).toBe('')
      expect(document.querySelector('form').method).toBe('post')
      expect(
        document.querySelector('button[type="submit"]').textContent.trim()
      ).toBe('Save and continue')
      expect(
        document.querySelector('.govuk-error-summary').textContent
      ).toContain('There is a problem')
      expect(
        document.querySelector('.govuk-error-message').textContent
      ).toContain('Enter the activity description')
    })

    test('should pass error to global catchAll handler', async () => {
      const apiPatchMock = jest.spyOn(authRequests, 'authenticatedPatchRequest')
      apiPatchMock.mockRejectedValueOnce({
        res: { statusCode: 500 },
        data: {}
      })

      const { result } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DESCRIPTION,
        payload: { activityDescription: 'test' }
      })

      expect(result).toContain('Something went wrong')

      const { document } = new JSDOM(result).window
      expect(document.querySelector('h1').textContent.trim()).toBe('500')
    })

    test('should correctly validate on empty data', () => {
      const payload = {
        activityDescription: ''
      }

      const h = {
        view: jest.fn().mockReturnThis(),
        takeover: jest.fn()
      }

      const err = {
        details: [
          {
            path: ['activityDescription'],
            message: 'test error message',
            type: 'string.empty'
          }
        ]
      }

      activityDescriptionSubmitController.options.validate.failAction(
        { payload, url: {} },
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
        backLink: routes.TASK_LIST,
        isSiteDetailsFlow: false,
        errorSummary: [
          {
            field: ['activityDescription'],
            text: 'test error message',
            href: '#activityDescription'
          }
        ],
        errors: {
          activityDescription: {
            field: ['activityDescription'],
            href: '#activityDescription',
            text: 'test error message'
          }
        },
        heading: 'Activity description',
        pageTitle: 'Activity description',
        payload: { activityDescription: '' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should correctly handle missing error details', () => {
      const payload = {
        activityDescription: ''
      }

      const h = {
        view: jest.fn().mockReturnThis(),
        takeover: jest.fn()
      }

      const err = {}

      activityDescriptionSubmitController.options.validate.failAction(
        { payload, url: {} },
        h,
        err
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should show error message with empty activity description', async () => {
      const apiPatchMock = jest.spyOn(authRequests, 'authenticatedPatchRequest')
      const fakeError = new Error('Bad Request')
      fakeError.data = {
        payload: {
          validation: {
            source: 'payload',
            keys: ['activityDescription'],
            details: [
              {
                field: 'activityDescription',
                message: 'ACTIVITY_DESCRIPTION_REQUIRED',
                type: 'string.empty'
              }
            ]
          }
        }
      }

      apiPatchMock.mockRejectedValueOnce(fakeError)

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: routes.ACTIVITY_DESCRIPTION,
        payload: { activityDescription: 'test' }
      })

      const { document } = new JSDOM(result).window
      expect(
        document.querySelector('.govuk-error-message').textContent.trim()
      ).toBe('Error: Enter the activity description')
      expect(document.querySelector('h2').textContent.trim()).toBe(
        'There is a problem'
      )
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
