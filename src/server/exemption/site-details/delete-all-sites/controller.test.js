import { vi } from 'vitest'
import {
  deleteAllSitesController,
  deleteAllSitesSubmitController
} from './controller.js'
import {
  getExemptionCache,
  resetExemptionSiteDetails
} from '#src/server/common/helpers/session-cache/utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  createMockRequest,
  mockExemption
} from '#src/server/test-helpers/mocks.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

const mockH = {
  view: vi.fn(),
  redirect: vi.fn()
}

const mockRequest = createMockRequest()

describe('deleteAllSitesController', () => {
  beforeEach(() => {
    getExemptionCache.mockReturnValue(mockExemption)
  })

  describe('deleteAllSitesController.handler', () => {
    it('should render delete all sites view with correct data', async () => {
      await deleteAllSitesController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/delete-all-sites/index',
        {
          pageTitle: 'Are you sure you want to delete all site details?',
          heading: 'Are you sure you want to delete all site details?',
          backLink: routes.REVIEW_SITE_DETAILS,
          routes
        }
      )
    })

    it('should redirect to correct page when no sites exist', async () => {
      const exemptionWithNoSites = {
        ...mockExemption,
        siteDetails: []
      }
      getExemptionCache.mockReturnValue(exemptionWithNoSites)

      await deleteAllSitesController.handler(mockRequest, mockH)

      expect(mockH.view).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
    })

    it('should redirect to review page when siteDetails is null', async () => {
      const exemptionWithNullSites = {
        ...mockExemption,
        multipleSiteDetails: {},
        siteDetails: null
      }
      getExemptionCache.mockReturnValue(exemptionWithNullSites)

      await deleteAllSitesController.handler(mockRequest, mockH)

      expect(mockH.view).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
    })
  })

  describe('deleteAllSitesSubmitController.handler', () => {
    beforeEach(() => {
      authenticatedPatchRequest.mockResolvedValue({
        payload: { success: true }
      })
    })

    it('should make authenticated patch request with empty siteDetails and redirect to task list', async () => {
      await deleteAllSitesSubmitController.handler(mockRequest, mockH)

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        mockRequest,
        '/exemption/site-details',
        {
          multipleSiteDetails: {},
          siteDetails: [],
          id: mockExemption.id
        }
      )

      expect(resetExemptionSiteDetails).toHaveBeenCalledWith(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
    })

    it('should handle no sites to delete error', async () => {
      const exemptionWithNoSites = {
        ...mockExemption,
        multipleSiteDetails: {},
        siteDetails: []
      }
      getExemptionCache.mockReturnValue(exemptionWithNoSites)

      await deleteAllSitesSubmitController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    })

    it('should handle null siteDetails error', async () => {
      const exemptionWithNullSites = {
        ...mockExemption,
        multipleSiteDetails: {},
        siteDetails: null
      }
      getExemptionCache.mockReturnValue(exemptionWithNullSites)

      await deleteAllSitesSubmitController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    })

    it('should handle API errors', async () => {
      authenticatedPatchRequest.mockRejectedValueOnce('test error')

      await deleteAllSitesSubmitController.handler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        {
          err: 'test error',
          exemptionId: mockExemption.id
        },
        'Error deleting all sites'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })
  })
})
