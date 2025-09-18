import {
  sameActivityDescriptionController,
  sameActivityDescriptionSubmitController
} from './controller.js'
import {
  getExemptionCache,
  updateExemptionMultipleSiteDetails,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { mockSite } from '~/src/server/test-helpers/mocks.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('sameActivityDescriptionController', () => {
  const mockRequest = {
    site: mockSite,
    logger: {
      info: jest.fn()
    }
  }

  const mockH = {
    view: jest.fn(),
    redirect: jest.fn()
  }

  const mockExemption = {
    id: 'test-exemption-id',
    projectName: 'Test Project Name',
    multipleSiteDetails: {},
    siteDetails: [{ activityDescription: 'Test description' }]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getExemptionCache).mockReturnValue(mockExemption)
  })

  describe('GET handler', () => {
    test('should render page with correct template and data', () => {
      sameActivityDescriptionController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/same-activity-description/index',
        {
          pageTitle: 'Is the activity description the same for every site?',
          heading: 'Is the activity description the same for every site?',
          backLink: routes.SITE_DETAILS_ACTIVITY_DATES,
          projectName: mockExemption.projectName,
          payload: {
            sameActivityDescription: undefined
          }
        }
      )
    })

    test('should pre-populate form when sameActivityDescription exists in cache', () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDescription: 'yes'
        }
      }
      jest.mocked(getExemptionCache).mockReturnValue(exemptionWithData)

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

    test('should skip page when not first site', () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDescription: 'no'
        }
      }
      jest.mocked(getExemptionCache).mockReturnValue(exemptionWithData)

      const mockRequestSecondSite = { ...mockRequest }
      mockRequestSecondSite.site = {
        ...mockRequest.site,
        siteIndex: 1,
        queryParams: '?site=1'
      }

      sameActivityDescriptionController.handler(mockRequestSecondSite, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/exemption/site-details-activity-description?site=1'
      )
    })

    test('should skip page and automatically update activity dates when not first site', () => {
      const exemptionWithData = {
        ...mockExemption,
        multipleSiteDetails: {
          sameActivityDescription: 'yes'
        }
      }
      jest.mocked(getExemptionCache).mockReturnValue(exemptionWithData)

      const mockRequestSecondSite = { ...mockRequest }
      mockRequestSecondSite.site = {
        ...mockRequest.site,
        siteIndex: 1,
        queryParams: '?site=1'
      }

      sameActivityDescriptionController.handler(mockRequestSecondSite, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequestSecondSite,
        1,
        'activityDescription',
        'Test description'
      )

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/exemption/how-do-you-want-to-enter-the-coordinates?site=1'
      )
    })
  })

  describe('POST handler', () => {
    test('should update cache and redirect to coordinates entry choice when "yes" is selected', () => {
      const requestWithPayload = {
        ...mockRequest,
        payload: {
          sameActivityDescription: 'yes'
        }
      }

      sameActivityDescriptionSubmitController.handler(requestWithPayload, mockH)

      expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
        requestWithPayload,
        'sameActivityDescription',
        'yes'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        routes.SITE_DETAILS_ACTIVITY_DESCRIPTION
      )
    })

    test('should update cache and redirect to coordinates entry choice when "no" is selected', () => {
      const requestWithPayload = {
        ...mockRequest,
        payload: {
          sameActivityDescription: 'no'
        }
      }

      sameActivityDescriptionSubmitController.handler(requestWithPayload, mockH)

      expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
        requestWithPayload,
        'sameActivityDescription',
        'no'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        routes.SITE_DETAILS_ACTIVITY_DESCRIPTION
      )
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
})
