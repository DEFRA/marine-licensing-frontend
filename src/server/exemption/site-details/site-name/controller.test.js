import { vi } from 'vitest'
import {
  siteNameController,
  siteNameSubmitController,
  SITE_NAME_VIEW_ROUTE,
  errorMessages
} from '#src/server/exemption/site-details/site-name/controller.js'
import { mockExemption as mockExemptionData } from '#src/server/test-helpers/mocks/exemption.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { routes } from '#src/server/common/constants/routes.js'
import * as cacheUtils from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/exemptions/save-site-details.js')

describe('#siteName', () => {
  let getExemptionCacheSpy

  beforeEach(() => {
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionData)

    vi.mocked(saveSiteDetailsToBackend).mockResolvedValue()
  })

  describe('#siteNameController', () => {
    test('should render with correct context and call utils function', () => {
      const mockSiteName = 'Test Site Name'
      const h = { view: vi.fn() }
      const request = createMockRequest()

      getExemptionCacheSpy.mockReturnValueOnce({
        ...mockExemptionData,
        siteDetails: [
          { ...mockExemptionData.siteDetails[0], siteName: mockSiteName }
        ]
      })

      siteNameController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: routes.MULTIPLE_SITES_CHOICE,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        payload: { siteName: mockSiteName },
        projectName: 'Test Project',
        siteNumber: 1,
        action: undefined
      })
    })

    test('should include action in view context when action parameter is present', () => {
      const h = { view: vi.fn() }
      const request = createMockRequest({ query: { action: 'add' } })

      siteNameController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        SITE_NAME_VIEW_ROUTE,
        expect.objectContaining({
          action: 'add'
        })
      )
    })

    test('should use review site details as back link and cancel link when action parameter is present', () => {
      const h = { view: vi.fn() }
      const request = createMockRequest({ query: { action: 'change' } })

      siteNameController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        SITE_NAME_VIEW_ROUTE,
        expect.objectContaining({
          backLink: `${routes.REVIEW_SITE_DETAILS}#site-details-1`,
          cancelLink: undefined
        })
      )
    })
  })

  describe('#siteNameSubmitController', () => {
    test('should redirect to next page when valid site name is submitted', async () => {
      const updateExemptionSiteDetailsSpy = vi.spyOn(
        cacheUtils,
        'updateExemptionSiteDetails'
      )

      const request = createMockRequest({
        payload: { siteName: 'Test Site Name' }
      })
      const h = { redirect: vi.fn() }

      await siteNameSubmitController.handler(request, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        request,
        h,
        0,
        'siteName',
        'Test Site Name'
      )
      expect(vi.mocked(saveSiteDetailsToBackend)).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(routes.SAME_ACTIVITY_DATES)
    })

    test('should redirect to review site details when action is add', async () => {
      const updateExemptionSiteDetailsSpy = vi.spyOn(
        cacheUtils,
        'updateExemptionSiteDetails'
      )

      const request = createMockRequest({
        payload: { siteName: 'New Site' },
        query: { action: 'add' }
      })
      const h = { redirect: vi.fn() }

      await siteNameSubmitController.handler(request, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        request,
        h,
        0,
        'siteName',
        'New Site'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        `${routes.REVIEW_SITE_DETAILS}#site-details-1`
      )
    })

    test('should redirect to review site details when action=change', async () => {
      const updateExemptionSiteDetailsSpy = vi.spyOn(
        cacheUtils,
        'updateExemptionSiteDetails'
      )

      const request = createMockRequest({
        payload: { siteName: 'Updated Site' },
        query: { action: 'change' }
      })
      const h = { redirect: vi.fn() }

      await siteNameSubmitController.handler(request, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        request,
        h,
        0,
        'siteName',
        'Updated Site'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        `${routes.REVIEW_SITE_DETAILS}#site-details-1`
      )
    })

    test('should save site details to backend when action parameter is present', async () => {
      const request = createMockRequest({
        payload: { siteName: 'Updated Site' },
        query: { action: 'change' }
      })
      const h = { redirect: vi.fn() }

      await siteNameSubmitController.handler(request, h)

      expect(vi.mocked(saveSiteDetailsToBackend)).toHaveBeenCalledWith(
        request,
        h
      )
    })

    test('should redirect to review site details with site parameter when both present', async () => {
      const updateExemptionSiteDetailsSpy = vi.spyOn(
        cacheUtils,
        'updateExemptionSiteDetails'
      )

      getExemptionCacheSpy.mockReturnValueOnce({
        ...mockExemptionData,
        siteDetails: [
          mockExemptionData.siteDetails[0],
          mockExemptionData.siteDetails[0]
        ]
      })

      const request = createMockRequest({
        payload: { siteName: 'Site 2 Name' },
        query: { site: '2', action: 'change' }
      })
      const h = { redirect: vi.fn() }

      await siteNameSubmitController.handler(request, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        request,
        h,
        1,
        'siteName',
        'Site 2 Name'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        `${routes.REVIEW_SITE_DETAILS}#site-details-2`
      )
    })

    test('should validate payload correctly', () => {
      const validationSchema = siteNameSubmitController.options.validate.payload

      expect(
        validationSchema.validate({ siteName: 'Valid Site Name' }).error
      ).toBeUndefined()
      expect(
        validationSchema.validate({ siteName: 'A'.repeat(250) }).error
      ).toBeUndefined()

      expect(validationSchema.validate({}).error).toBeDefined()
      expect(validationSchema.validate({ siteName: '' }).error).toBeDefined()
      expect(
        validationSchema.validate({ siteName: 'A'.repeat(251) }).error
      ).toBeDefined()
    })

    test('should have correct error messages', () => {
      expect(errorMessages.SITE_NAME_REQUIRED).toBe('Enter the site name')
      expect(errorMessages.SITE_NAME_MAX_LENGTH).toBe(
        'Site name should be 250 characters or less'
      )
    })

    test('should handle validation failure with error details', () => {
      const request = createMockRequest({
        payload: { siteName: '' }
      })
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      const err = {
        details: [
          {
            message: 'SITE_NAME_REQUIRED',
            field: ['siteName']
          }
        ]
      }

      siteNameSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: routes.MULTIPLE_SITES_CHOICE,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        payload: { siteName: '' },
        projectName: 'Test Project',
        siteNumber: 1,
        action: undefined,
        errors: expect.any(Object),
        errorSummary: expect.any(Array)
      })
    })

    test('should handle validation failure without error details', () => {
      const request = createMockRequest({
        payload: { siteName: 'invalid' }
      })
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      siteNameSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: routes.MULTIPLE_SITES_CHOICE,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        payload: { siteName: 'invalid' },
        projectName: 'Test Project',
        siteNumber: 1,
        action: undefined
      })
    })

    test('should preserve action parameter in validation failure', () => {
      const request = createMockRequest({
        payload: { siteName: '' },
        query: { action: 'add' }
      })
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      const err = {
        details: [
          {
            message: 'SITE_NAME_REQUIRED',
            field: ['siteName']
          }
        ]
      }

      siteNameSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(
        SITE_NAME_VIEW_ROUTE,
        expect.objectContaining({
          action: 'add',
          backLink: `${routes.REVIEW_SITE_DETAILS}#site-details-1`,
          cancelLink: undefined
        })
      )
    })
  })
})
