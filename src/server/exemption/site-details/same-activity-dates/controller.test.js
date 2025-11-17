import { vi } from 'vitest'
import {
  sameActivityDatesController,
  sameActivityDatesSubmitController,
  SAME_ACTIVITY_DATES_VIEW_ROUTE
} from './controller.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'
import {
  mockExemption,
  mockFileUploadExemption,
  mockSite
} from '#src/server/test-helpers/mocks.js'
import { routes } from '#src/server/common/constants/routes.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/save-site-details.js'
import * as copyActivityData from '#src/server/common/helpers/copy-same-activity-data.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/save-site-details.js')

describe('#sameActivityDates', () => {
  let getExemptionCacheSpy
  let clearActivityDataMock

  const sitePreHandlerHook = sameActivityDatesSubmitController.options.pre[0]

  const mockH = {
    view: vi.fn(),
    redirect: vi.fn()
  }

  beforeEach(() => {
    clearActivityDataMock = vi.spyOn(copyActivityData, 'clearActivityData')
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  describe('#sameActivityDatesController', () => {
    test('sameActivityDatesController handler should render with correct context', () => {
      const h = { view: vi.fn() }

      sameActivityDatesController.handler({ site: mockSite, query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
        pageTitle: 'Are the activity dates the same for every site?',
        heading: 'Are the activity dates the same for every site?',
        backLink: routes.SITE_NAME,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        payload: {
          sameActivityDates:
            mockExemption.multipleSiteDetails?.sameActivityDates
        },
        projectName: 'Test Project'
      })
    })

    test('sameActivityDatesController handler should render with correct context with no existing cache data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName
      })

      const h = { view: vi.fn() }

      const request = { site: mockSite, query: {} }

      sameActivityDatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
        pageTitle: 'Are the activity dates the same for every site?',
        heading: 'Are the activity dates the same for every site?',
        backLink: routes.SITE_NAME,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        payload: { sameActivityDates: undefined },
        projectName: 'Test Project'
      })
    })

    test('should skip page when not first site', () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDates: 'no'
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithData)

      const mockRequestSecondSite = {
        site: {
          ...mockSite,
          siteIndex: 1,
          queryParams: '?site=1'
        },
        query: {}
      }

      sameActivityDatesController.handler(mockRequestSecondSite, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/exemption/activity-dates?site=1'
      )
    })

    test('should skip page and automatically update activity dates when not first site', async () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDates: 'yes'
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithData)

      const mockRequestSecondSite = {
        site: {
          ...mockSite,
          siteIndex: 1,
          queryParams: '?site=1'
        },
        query: {}
      }

      await sameActivityDatesController.handler(mockRequestSecondSite, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequestSecondSite,
        mockH,
        1,
        'activityDates',
        mockExemption.siteDetails[0].activityDates
      )

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/exemption/same-activity-description?site=1'
      )
    })

    test('should render with RSD backlink and no cancelLink when action param is present', () => {
      const h = { view: vi.fn() }

      const request = {
        site: mockSite,
        query: { action: 'change' }
      }

      sameActivityDatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
        pageTitle: 'Are the activity dates the same for every site?',
        heading: 'Are the activity dates the same for every site?',
        backLink: routes.REVIEW_SITE_DETAILS,
        cancelLink: undefined,
        payload: {
          sameActivityDates:
            mockExemption.multipleSiteDetails?.sameActivityDates
        },
        projectName: 'Test Project'
      })
    })
  })

  describe('#sameActivityDatesSubmitController', () => {
    test('Should correctly format error data', () => {
      const request = {
        payload: { sameActivityDates: 'invalid' },
        query: {}
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['sameActivityDates'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      sameActivityDatesSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
        pageTitle: 'Are the activity dates the same for every site?',
        heading: 'Are the activity dates the same for every site?',
        backLink: routes.SITE_NAME,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        projectName: 'Test Project',
        payload: { sameActivityDates: 'invalid' },
        errorSummary: [
          {
            href: '#sameActivityDates',
            text: 'TEST',
            field: ['sameActivityDates']
          }
        ],
        errors: {
          sameActivityDates: {
            field: ['sameActivityDates'],
            href: '#sameActivityDates',
            text: 'TEST'
          }
        }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly output page with no error data in object for manual uploads', () => {
      const request = {
        payload: { sameActivityDates: 'invalid' },
        site: { siteDetails: mockExemption.siteDetails[0] },
        query: {}
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      sameActivityDatesSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )

      expect(h.view).toHaveBeenCalledWith(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
        pageTitle: 'Are the activity dates the same for every site?',
        heading: 'Are the activity dates the same for every site?',
        backLink: routes.SITE_NAME,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        projectName: 'Test Project',
        payload: { sameActivityDates: 'invalid' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly output page with no error data in object for file uploads', () => {
      const request = {
        payload: { sameActivityDates: 'invalid' },
        site: { siteDetails: mockFileUploadExemption.siteDetails[0] },
        query: {}
      }

      getExemptionCacheSpy.mockReturnValue(mockFileUploadExemption)

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      sameActivityDatesSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )

      expect(h.view).toHaveBeenCalledWith(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
        pageTitle: 'Are the activity dates the same for every site?',
        heading: 'Are the activity dates the same for every site?',
        backLink: routes.FILE_UPLOAD,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        projectName: 'Test Project',
        payload: { sameActivityDates: 'invalid' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly validate on valid data', () => {
      const request = {
        sameActivityDates: 'yes'
      }

      const payloadValidator =
        sameActivityDatesSubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate on empty data', () => {
      const request = {}

      const payloadValidator =
        sameActivityDatesSubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error.message).toBe('SAME_ACTIVITY_DATES_REQUIRED')
    })

    test('Should correctly validate on invalid data', () => {
      const request = { sameActivityDates: 'invalid' }

      const payloadValidator =
        sameActivityDatesSubmitController.options.validate.payload

      const result = payloadValidator.validate(request)

      expect(result.error.message).toBe('SAME_ACTIVITY_DATES_REQUIRED')
    })

    test('Should correctly navigate to next page when POST is successful', async () => {
      const h = {
        redirect: vi.fn()
      }

      const mockRequest = {
        payload: { sameActivityDates: 'yes' },
        query: {}
      }

      sitePreHandlerHook.method(mockRequest, h)

      await sameActivityDatesSubmitController.handler(mockRequest, h)

      expect(
        cacheUtils.updateExemptionMultipleSiteDetails
      ).toHaveBeenCalledWith(mockRequest, h, 'sameActivityDates', 'yes')

      expect(h.redirect).toHaveBeenCalledWith(routes.ACTIVITY_DATES)
    })

    test('Should redirect to RSD when action param present and answer unchanged', async () => {
      const h = { redirect: vi.fn() }

      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDates: 'yes'
        }
      }

      getExemptionCacheSpy.mockReturnValue(exemptionWithData)

      const mockRequest = {
        payload: { sameActivityDates: 'yes' },
        query: { action: 'change' },
        site: mockSite
      }

      sitePreHandlerHook.method(mockRequest, h)

      await sameActivityDatesSubmitController.handler(mockRequest, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('Should redirect to activity-dates with action param when changing from no to yes', async () => {
      const h = { redirect: vi.fn() }

      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDates: 'no'
        }
      }

      getExemptionCacheSpy.mockReturnValue(exemptionWithData)

      const mockRequest = {
        payload: { sameActivityDates: 'yes' },
        query: { action: 'change' },
        site: mockSite
      }

      sitePreHandlerHook.method(mockRequest, h)

      await sameActivityDatesSubmitController.handler(mockRequest, h)

      expect(clearActivityDataMock).toHaveBeenCalledWith(
        mockRequest,
        'activityDates',
        h
      )

      expect(
        cacheUtils.updateExemptionMultipleSiteDetails
      ).toHaveBeenCalledWith(mockRequest, h, 'sameActivityDates', 'yes')

      expect(h.redirect).toHaveBeenCalledWith(
        routes.ACTIVITY_DATES + '?action=change'
      )
    })

    test('Should copy dates to all sites and save when changing from yes to no with action param', async () => {
      const h = { redirect: vi.fn() }

      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDates: 'yes'
        },
        siteDetails: [
          {
            activityDates: { start: '2024-01-01', end: '2024-12-31' }
          },
          {},
          {}
        ]
      }

      getExemptionCacheSpy.mockReturnValue(exemptionWithData)

      const mockRequest = {
        payload: { sameActivityDates: 'no' },
        query: { action: 'change' },
        site: mockSite
      }

      sitePreHandlerHook.method(mockRequest, h)

      await sameActivityDatesSubmitController.handler(mockRequest, h)

      expect(
        cacheUtils.updateExemptionMultipleSiteDetails
      ).toHaveBeenCalledWith(mockRequest, h, 'sameActivityDates', 'no')

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        h,
        1,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        h,
        2,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )

      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(mockRequest, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })
  })
})
