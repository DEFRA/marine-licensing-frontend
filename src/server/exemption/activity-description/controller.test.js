import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { routes } from '#src/server/common/constants/routes.js'
import { mockExemption } from '#src/server/test-helpers/mocks.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'
import { JSDOM } from 'jsdom'
import {
  activityDescriptionController,
  activityDescriptionSubmitController,
  ACTIVITY_DESCRIPTION_VIEW_ROUTE
} from '#src/server/exemption/activity-description/controller.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as saveSiteDetails from '#src/server/common/helpers/save-site-details.js'
import { getByRole } from '@testing-library/dom'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/save-site-details.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('#activityDescriptionController', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy
  const request = { url: {} }

  const mockExemptionState = {}

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: { id: mockExemption.id }
    })

    vi.mocked(saveSiteDetails.saveSiteDetailsToBackend).mockResolvedValue()

    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionState)
  })

  describe('activityDescriptionController GET', () => {
    test('should render the activity description page', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: routes.ACTIVITY_DESCRIPTION,
        server: getServer()
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
        getByRole(document, 'button', { name: 'Save and continue' })
      ).toHaveAttribute('type', 'submit')
    })

    test('handler should render with correct context', () => {
      const h = { view: vi.fn() }

      activityDescriptionController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
        action: undefined,
        backLink: routes.TASK_LIST,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        isMultiSiteJourney: false,
        isSiteDetailsFlow: false,
        pageTitle: 'Activity description',
        heading: 'Activity description',
        payload: { activityDescription: undefined },
        projectName: undefined,
        siteNumber: null
      })

      getExemptionCacheSpy.mockResolvedValueOnce(null)

      activityDescriptionController.handler(request, h)

      expect(h.view).toHaveBeenNthCalledWith(
        2,
        ACTIVITY_DESCRIPTION_VIEW_ROUTE,
        {
          action: undefined,
          backLink: routes.TASK_LIST,
          cancelLink: routes.TASK_LIST + '?cancel=site-details',
          isMultiSiteJourney: false,
          isSiteDetailsFlow: false,
          pageTitle: 'Activity description',
          heading: 'Activity description',
          payload: { activityDescription: undefined },
          projectName: undefined,
          siteNumber: null
        }
      )
    })

    test('handler should render with correct context for site details flow', () => {
      const h = { view: vi.fn() }
      const request = {
        url: { pathname: routes.SITE_DETAILS_ACTIVITY_DESCRIPTION }
      }
      const exemptionWithSiteDetails = {
        ...mockExemptionState,
        siteDetails: [
          {
            activityDescription: 'Site activity description'
          }
        ]
      }

      getExemptionCacheSpy.mockReturnValue(exemptionWithSiteDetails)

      activityDescriptionController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
        action: undefined,
        backLink: routes.SITE_DETAILS_ACTIVITY_DATES,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        isMultiSiteJourney: false,
        isSiteDetailsFlow: true,
        pageTitle: 'Activity description',
        heading: 'Activity description',
        payload: { activityDescription: 'Site activity description' },
        projectName: undefined,
        siteNumber: null
      })
    })

    test('should set back link to correct page for single site file upload', () => {
      const h = { view: vi.fn() }
      const request = {
        url: { pathname: routes.SITE_DETAILS_ACTIVITY_DESCRIPTION },
        site: { siteIndex: 0, siteDetails: { coordinatesType: 'file' } }
      }

      const exemptionWithFileUpload = {
        projectName: 'Test Project',
        siteDetails: [
          {
            coordinatesType: 'file',
            fileUploadType: 'kml',
            activityDescription: 'Test file upload activity'
          }
        ],
        multipleSiteDetails: {
          multipleSitesEnabled: false
        }
      }

      getExemptionCacheSpy.mockReturnValue(exemptionWithFileUpload)

      activityDescriptionController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        ACTIVITY_DESCRIPTION_VIEW_ROUTE,
        expect.objectContaining({
          backLink: routes.SITE_DETAILS_ACTIVITY_DATES,
          isSiteDetailsFlow: true,
          isMultiSiteJourney: false
        })
      )
    })
  })

  describe('activityDescriptionController POST', () => {
    test('should handle form submission with valid data', async () => {
      const apiPatchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
      const payload = {
        activityDescription: 'This is a test activity description.'
      }

      apiPatchMock.mockResolvedValueOnce({
        res: { statusCode: 200 },
        payload: { data: 'test' }
      })

      const { statusCode, headers } = await makePostRequest({
        url: routes.ACTIVITY_DESCRIPTION,
        server: getServer(),
        formData: payload,
        headers: {
          cookie: 'cookies_preferences_set=true'
        }
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
      const mockedUpdateExemptionSiteDetails = vi.mocked(
        cacheUtils.updateExemptionSiteDetails
      )

      const exemptionWithSiteDetails = {
        ...mockExemption,
        multipleSiteDetails: { multipleSitesEnabled: false },
        siteDetails: [
          {
            activityDescription: 'Existing site activity description'
          }
        ]
      }

      getExemptionCacheSpy.mockReturnValue(exemptionWithSiteDetails)

      const payload = {
        activityDescription: 'New site activity description.'
      }

      const { statusCode, headers } = await makePostRequest({
        url: routes.SITE_DETAILS_ACTIVITY_DESCRIPTION,
        server: getServer(),
        formData: payload
      })

      expect(mockedUpdateExemptionSiteDetails).toHaveBeenCalledWith(
        expect.any(Object),
        0,
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

      const { result, statusCode } = await makePostRequest({
        url: routes.ACTIVITY_DESCRIPTION,
        server: getServer(),
        formData: payload,
        headers: {
          cookie: 'cookies_preferences_set=true'
        }
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
      const apiPatchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
      apiPatchMock.mockRejectedValueOnce({
        res: { statusCode: 500 },
        data: {}
      })

      const { result } = await makePostRequest({
        url: routes.ACTIVITY_DESCRIPTION,
        server: getServer(),
        formData: { activityDescription: 'test' }
      })

      expect(result).toContain('There is a problem with the service')

      const { document } = new JSDOM(result).window
      expect(document.querySelector('h1').textContent.trim()).toBe(
        'There is a problem with the service'
      )
    })

    test('should correctly validate on empty data', () => {
      const payload = {
        activityDescription: ''
      }

      const h = {
        view: vi.fn().mockReturnThis(),
        takeover: vi.fn()
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
        action: undefined,
        backLink: routes.TASK_LIST,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        isMultiSiteJourney: false,
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
        payload: { activityDescription: '' },
        projectName: undefined,
        siteNumber: null
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should correctly handle missing error details', () => {
      const payload = {
        activityDescription: ''
      }

      const h = {
        view: vi.fn().mockReturnThis(),
        takeover: vi.fn()
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
      const apiPatchMock = vi.spyOn(authRequests, 'authenticatedPatchRequest')
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

      const { result, statusCode } = await makePostRequest({
        url: routes.ACTIVITY_DESCRIPTION,
        server: getServer(),
        formData: { activityDescription: 'test' },
        headers: {
          cookie: 'cookies_preferences_set=true'
        }
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

    test('should save site details to backend when action parameter is present and in site details flow', async () => {
      const payload = { activityDescription: 'Updated activity description' }

      const request = {
        payload,
        query: { action: 'change' },
        url: { pathname: routes.SITE_DETAILS_ACTIVITY_DESCRIPTION },
        site: { siteIndex: 0, siteNumber: 1 }
      }
      const h = { redirect: vi.fn() }

      await activityDescriptionSubmitController.handler(request, h)

      expect(
        vi.mocked(saveSiteDetails.saveSiteDetailsToBackend)
      ).toHaveBeenCalledWith(request)
    })

    test('should save site details to backend when going to review site details (file upload flow)', async () => {
      const payload = { activityDescription: 'Activity description' }

      const request = {
        payload,
        url: { pathname: routes.SITE_DETAILS_ACTIVITY_DESCRIPTION },
        site: {
          siteIndex: 0,
          siteNumber: 1,
          siteDetails: { coordinatesType: 'file' }
        }
      }
      const h = { redirect: vi.fn() }

      await activityDescriptionSubmitController.handler(request, h)

      expect(
        vi.mocked(saveSiteDetails.saveSiteDetailsToBackend)
      ).toHaveBeenCalledWith(request)
    })

    test('should not save site details to backend when action parameter is not present and not going to review', async () => {
      const payload = { activityDescription: 'Activity description' }

      const request = {
        payload,
        url: { pathname: routes.SITE_DETAILS_ACTIVITY_DESCRIPTION },
        site: {
          siteIndex: 0,
          siteNumber: 1,
          siteDetails: { coordinatesType: 'coordinates' }
        }
      }
      const h = { redirect: vi.fn() }

      await activityDescriptionSubmitController.handler(request, h)

      expect(
        vi.mocked(saveSiteDetails.saveSiteDetailsToBackend)
      ).not.toHaveBeenCalled()
    })
  })
})
