import {
  sameActivityDescriptionController,
  sameActivityDescriptionSubmitController
} from './controller.js'
import {
  getExemptionCache,
  updateExemptionMultipleSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('sameActivityDescriptionController', () => {
  const mockRequest = {
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
    multipleSiteDetails: {}
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
        routes.COORDINATES_ENTRY_CHOICE
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
        routes.COORDINATES_ENTRY_CHOICE
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
