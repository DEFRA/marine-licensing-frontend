import { vi } from 'vitest'
import {
  sameActivityDescriptionController,
  sameActivityDescriptionSubmitController
} from './controller.js'
import {
  getExemptionCache,
  updateExemptionMultipleSiteDetails,
  updateExemptionSiteDetails
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { mockSite } from '#src/server/test-helpers/mocks/exemption.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'
import * as copyActivityData from '#src/server/common/helpers/exemptions/copy-same-activity-data.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/exemptions/save-site-details.js')

describe('sameActivityDescriptionController', () => {
  let clearActivityDataMock

  const mockRequest = {
    site: mockSite,
    query: {},
    logger: {
      info: vi.fn()
    }
  }

  const mockH = {
    view: vi.fn(),
    redirect: vi.fn()
  }

  const mockExemption = {
    id: 'test-exemption-id',
    projectName: 'Test Project Name',
    multipleSiteDetails: {},
    siteDetails: [{ activityDescription: 'Test description' }]
  }

  beforeEach(() => {
    clearActivityDataMock = vi.spyOn(copyActivityData, 'clearActivityData')
    vi.mocked(getExemptionCache).mockReturnValue(mockExemption)
  })

  describe('GET handler', () => {
    test('should render page with correct template and data', async () => {
      sameActivityDescriptionController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/same-activity-description/index',
        {
          pageTitle: 'Is the activity description the same for every site?',
          heading: 'Is the activity description the same for every site?',
          backLink: routes.ACTIVITY_DATES,
          cancelLink: routes.TASK_LIST + '?cancel=site-details',
          projectName: mockExemption.projectName,
          payload: {
            sameActivityDescription: undefined
          }
        }
      )
    })

    test('should pre-populate form when sameActivityDescription exists in cache', async () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDescription: 'yes'
        }
      }
      vi.mocked(getExemptionCache).mockReturnValue(exemptionWithData)

      sameActivityDescriptionController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/same-activity-description/index',
        expect.objectContaining({
          payload: {
            sameActivityDescription: 'yes'
          }
        })
      )
    })

    test('should skip page when not first site', async () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDescription: 'no'
        }
      }
      vi.mocked(getExemptionCache).mockReturnValue(exemptionWithData)

      const mockRequestSecondSite = { ...mockRequest }
      mockRequestSecondSite.site = {
        ...mockRequest.site,
        siteIndex: 1,
        queryParams: '?site=1'
      }

      await sameActivityDescriptionController.handler(
        mockRequestSecondSite,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/exemption/activity-description?site=1'
      )
    })

    test('should skip page and automatically update activity dates when not first site', async () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDescription: 'yes'
        }
      }
      vi.mocked(getExemptionCache).mockReturnValue(exemptionWithData)

      const mockRequestSecondSite = { ...mockRequest }
      mockRequestSecondSite.site = {
        ...mockRequest.site,
        siteIndex: 1,
        queryParams: '?site=1'
      }

      await sameActivityDescriptionController.handler(
        mockRequestSecondSite,
        mockH
      )

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequestSecondSite,
        mockH,
        1,
        'activityDescription',
        'Test description'
      )

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/exemption/how-do-you-want-to-enter-the-coordinates?site=1'
      )
    })

    test('should render with RSD backlink and no cancelLink when action param is present', () => {
      const requestWithAction = {
        ...mockRequest,
        query: { action: 'change' }
      }

      sameActivityDescriptionController.handler(requestWithAction, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/same-activity-description/index',
        {
          pageTitle: 'Is the activity description the same for every site?',
          heading: 'Is the activity description the same for every site?',
          backLink: routes.REVIEW_SITE_DETAILS,
          cancelLink: undefined,
          projectName: mockExemption.projectName,
          payload: {
            sameActivityDescription: undefined
          }
        }
      )
    })
  })

  describe('POST handler', () => {
    test('should update cache and redirect to coordinates entry choice when "yes" is selected', async () => {
      const requestWithPayload = {
        ...mockRequest,
        payload: {
          sameActivityDescription: 'yes'
        }
      }

      await sameActivityDescriptionSubmitController.handler(
        requestWithPayload,
        mockH
      )

      expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
        requestWithPayload,
        mockH,
        'sameActivityDescription',
        'yes'
      )

      expect(saveSiteDetailsToBackend).not.toHaveBeenCalled()

      expect(mockH.redirect).toHaveBeenCalledWith(routes.ACTIVITY_DESCRIPTION)
    })

    test('should update cache and redirect to coordinates entry choice when "no" is selected', async () => {
      const requestWithPayload = {
        ...mockRequest,
        payload: {
          sameActivityDescription: 'no'
        }
      }

      await sameActivityDescriptionSubmitController.handler(
        requestWithPayload,
        mockH
      )

      expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
        requestWithPayload,
        mockH,
        'sameActivityDescription',
        'no'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.ACTIVITY_DESCRIPTION)
    })

    test('should redirect to RSD when action param present and answer unchanged', async () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDescription: 'yes'
        }
      }
      vi.mocked(getExemptionCache).mockReturnValue(exemptionWithData)

      const requestWithPayload = {
        ...mockRequest,
        query: { action: 'change' },
        payload: {
          sameActivityDescription: 'yes'
        }
      }

      await sameActivityDescriptionSubmitController.handler(
        requestWithPayload,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should redirect to activity-description with action param when changing from no to yes', async () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDescription: 'no'
        }
      }
      vi.mocked(getExemptionCache).mockReturnValue(exemptionWithData)

      const requestWithPayload = {
        ...mockRequest,
        query: { action: 'change' },
        payload: {
          sameActivityDescription: 'yes'
        }
      }

      await sameActivityDescriptionSubmitController.handler(
        requestWithPayload,
        mockH
      )

      expect(clearActivityDataMock).toHaveBeenCalledWith(
        requestWithPayload,
        'activityDescription',
        mockH
      )

      expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
        requestWithPayload,
        mockH,
        'sameActivityDescription',
        'yes'
      )

      expect(mockH.redirect).toHaveBeenCalledWith(
        routes.ACTIVITY_DESCRIPTION + '?action=change'
      )
    })

    test('should copy description to all sites and save when changing from yes to no with action param', async () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDescription: 'yes'
        },
        siteDetails: [{ activityDescription: 'Shared description' }, {}, {}]
      }
      vi.mocked(getExemptionCache).mockReturnValue(exemptionWithData)

      const requestWithPayload = {
        ...mockRequest,
        query: { action: 'change' },
        payload: {
          sameActivityDescription: 'no'
        }
      }

      await sameActivityDescriptionSubmitController.handler(
        requestWithPayload,
        mockH
      )

      expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
        requestWithPayload,
        mockH,
        'sameActivityDescription',
        'no'
      )

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        requestWithPayload,
        mockH,
        1,
        'activityDescription',
        'Shared description'
      )

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        requestWithPayload,
        mockH,
        2,
        'activityDescription',
        'Shared description'
      )

      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(
        requestWithPayload,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })
  })

  describe('validation', () => {
    test('should require sameActivityDescription field', () => {
      const validation =
        sameActivityDescriptionSubmitController.options.validate.payload

      const { error } = validation.validate({})

      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'SAME_ACTIVITY_DESCRIPTION_REQUIRED'
      )
    })

    test('should only accept "yes" or "no" values', () => {
      const validation =
        sameActivityDescriptionSubmitController.options.validate.payload

      const { error: invalidError } = validation.validate({
        sameActivityDescription: 'invalid'
      })
      expect(invalidError).toBeDefined()
      expect(invalidError.details[0].message).toBe(
        'SAME_ACTIVITY_DESCRIPTION_REQUIRED'
      )

      const { error: yesError } = validation.validate({
        sameActivityDescription: 'yes'
      })
      expect(yesError).toBeUndefined()

      const { error: noError } = validation.validate({
        sameActivityDescription: 'no'
      })
      expect(noError).toBeUndefined()
    })

    test('should reject empty string', () => {
      const validation =
        sameActivityDescriptionSubmitController.options.validate.payload

      const { error } = validation.validate({
        sameActivityDescription: ''
      })

      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'SAME_ACTIVITY_DESCRIPTION_REQUIRED'
      )
    })
  })

  describe('sameActivityDescriptionController', () => {
    test('Should handle validation failure with err.details in failAction', () => {
      const request = {
        payload: { sameActivityDescription: 'invalid' },
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
            path: ['sameActivityDescription'],
            message: 'SAME_ACTIVITY_DESCRIPTION_REQUIRED',
            type: 'any.only'
          }
        ]
      }

      sameActivityDescriptionSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(
        'exemption/site-details/same-activity-description/index',
        {
          pageTitle: 'Is the activity description the same for every site?',
          heading: 'Is the activity description the same for every site?',
          backLink: routes.ACTIVITY_DATES,
          cancelLink: routes.TASK_LIST + '?cancel=site-details',
          projectName: 'Test Project Name',
          payload: { sameActivityDescription: 'invalid' },
          errorSummary: [
            {
              href: '#sameActivityDescription',
              text: 'Select whether the activity description is the same for every site',
              field: ['sameActivityDescription']
            }
          ],
          errors: {
            sameActivityDescription: {
              field: ['sameActivityDescription'],
              href: '#sameActivityDescription',
              text: 'Select whether the activity description is the same for every site'
            }
          }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should handle validation failure without err.details in failAction', () => {
      const request = {
        payload: { sameActivityDescription: 'invalid' },
        query: {}
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {}

      sameActivityDescriptionSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(
        'exemption/site-details/same-activity-description/index',
        {
          pageTitle: 'Is the activity description the same for every site?',
          heading: 'Is the activity description the same for every site?',
          backLink: routes.ACTIVITY_DATES,
          cancelLink: routes.TASK_LIST + '?cancel=site-details',
          projectName: 'Test Project Name',
          payload: { sameActivityDescription: 'invalid' }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should handle successful validation in handler', async () => {
      const h = { redirect: vi.fn() }

      const mockRequest = {
        payload: { sameActivityDescription: 'yes' },
        query: {},
        site: mockSite
      }

      await sameActivityDescriptionSubmitController.handler(mockRequest, h)

      expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        h,
        'sameActivityDescription',
        'yes'
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.ACTIVITY_DESCRIPTION)
    })
  })
})
