import { vi } from 'vitest'
import {
  siteNameController,
  siteNameSubmitController,
  SITE_NAME_VIEW_ROUTE,
  errorMessages
} from '#src/server/exemption/site-details/site-name/controller.js'
import { mockExemption as mockExemptionData } from '#src/server/test-helpers/mocks.js'
import { routes } from '#src/server/common/constants/routes.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#siteName', () => {
  let getExemptionCacheSpy

  const sitePreHandlerHook = siteNameController.options.pre[0]

  beforeEach(() => {
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionData)
  })

  describe('#siteNameController', () => {
    test('should render with correct context and call utils function', () => {
      const mockSiteName = 'Test Site Name'
      const h = { view: vi.fn() }
      const request = {}

      getExemptionCacheSpy.mockReturnValueOnce({
        ...mockExemptionData,
        siteDetails: [
          { ...mockExemptionData.siteDetails[0], siteName: mockSiteName }
        ]
      })

      sitePreHandlerHook.method(request, h)

      siteNameController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: routes.MULTIPLE_SITES_CHOICE,
        payload: { siteName: mockSiteName },
        projectName: 'Test Project',
        siteNumber: 1
      })
    })
  })

  describe('#siteNameSubmitController', () => {
    test('should redirect to next page when valid site name is submitted', () => {
      const updateExemptionSiteDetailsSpy = vi.spyOn(
        cacheUtils,
        'updateExemptionSiteDetails'
      )

      const request = {
        payload: { siteName: 'Test Site Name' }
      }
      const h = { redirect: vi.fn() }

      sitePreHandlerHook.method(request, h)
      siteNameSubmitController.handler(request, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        request,
        0,
        'siteName',
        'Test Site Name'
      )
      expect(h.redirect).toHaveBeenCalledWith(routes.SAME_ACTIVITY_DATES)
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
      const request = {
        payload: { siteName: '' }
      }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      const err = {
        details: [
          {
            message: 'SITE_NAME_REQUIRED',
            field: ['siteName']
          }
        ]
      }

      sitePreHandlerHook.method(request, h)

      siteNameSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: routes.MULTIPLE_SITES_CHOICE,
        payload: { siteName: '' },
        projectName: 'Test Project',
        siteNumber: 1,
        errors: expect.any(Object),
        errorSummary: expect.any(Array)
      })
    })

    test('should handle validation failure without error details', () => {
      const request = {
        payload: { siteName: 'invalid' }
      }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      sitePreHandlerHook.method(request, h)

      siteNameSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: routes.MULTIPLE_SITES_CHOICE,
        payload: { siteName: 'invalid' },
        projectName: 'Test Project',
        siteNumber: 1
      })
    })
  })
})
