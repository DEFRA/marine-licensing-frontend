import { vi } from 'vitest'
import {
  sameActivityDatesController,
  sameActivityDatesSubmitController,
  SAME_ACTIVITY_DATES_VIEW_ROUTE
} from './controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import {
  mockExemption,
  mockFileUploadExemption,
  mockSite
} from '~/src/server/test-helpers/mocks.js'
import { routes } from '~/src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#sameActivityDates', () => {
  let getExemptionCacheSpy

  const sitePreHandlerHook = sameActivityDatesSubmitController.options.pre[0]

  const mockH = {
    view: vi.fn(),
    redirect: vi.fn()
  }

  beforeEach(() => {
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  describe('#sameActivityDatesController', () => {
    test('sameActivityDatesController handler should render with correct context', () => {
      const h = { view: vi.fn() }

      sameActivityDatesController.handler({ site: mockSite }, h)

      expect(h.view).toHaveBeenCalledWith(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
        pageTitle: 'Are the activity dates the same for every site?',
        heading: 'Are the activity dates the same for every site?',
        backLink: routes.SITE_NAME,
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

      const request = { site: mockSite }

      sameActivityDatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(SAME_ACTIVITY_DATES_VIEW_ROUTE, {
        pageTitle: 'Are the activity dates the same for every site?',
        heading: 'Are the activity dates the same for every site?',
        backLink: routes.SITE_NAME,
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
        }
      }

      sameActivityDatesController.handler(mockRequestSecondSite, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/exemption/site-details-activity-dates?site=1'
      )
    })

    test('should skip page and automatically update activity dates when not first site', () => {
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
        }
      }

      sameActivityDatesController.handler(mockRequestSecondSite, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequestSecondSite,
        1,
        'activityDates',
        mockExemption.siteDetails[0].activityDates
      )

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/exemption/same-activity-description?site=1'
      )
    })
  })

  describe('#sameActivityDatesSubmitController', () => {
    test('Should correctly format error data', () => {
      const request = {
        payload: { sameActivityDates: 'invalid' }
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
        site: { siteDetails: mockExemption.siteDetails[0] }
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
        projectName: 'Test Project',
        payload: { sameActivityDates: 'invalid' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly output page with no error data in object for file uploads', () => {
      const request = {
        payload: { sameActivityDates: 'invalid' },
        site: { siteDetails: mockFileUploadExemption.siteDetails[0] }
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
        payload: { sameActivityDates: 'yes' }
      }

      sitePreHandlerHook.method(mockRequest, h)

      await sameActivityDatesSubmitController.handler(mockRequest, h)

      expect(
        cacheUtils.updateExemptionMultipleSiteDetails
      ).toHaveBeenCalledWith(mockRequest, 'sameActivityDates', 'yes')

      expect(h.redirect).toHaveBeenCalledWith(
        routes.SITE_DETAILS_ACTIVITY_DATES
      )
    })
  })
})
