import { vi } from 'vitest'
import {
  deleteSiteController,
  deleteSiteSubmitController
} from './controller.js'
import {
  getExemptionCache,
  setExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'
import { setSiteDataPreHandler } from '#src/server/common/helpers/session-cache/site-utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import { mockExemption } from '#src/server/test-helpers/mocks.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/session-cache/site-utils.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

const mockH = {
  view: vi.fn(),
  redirect: vi.fn()
}

const mockRequest = {
  site: {
    siteNumber: '1',
    siteIndex: 0,
    siteDetails: mockExemption.siteDetails[0]
  },
  payload: {
    siteIndex: '0'
  },
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}

describe('deleteSiteController', () => {
  beforeEach(() => {
    getExemptionCache.mockReturnValue(mockExemption)
  })

  describe('deleteSiteController.handler', () => {
    it('should render delete site view with correct data for manual coordinates', async () => {
      await deleteSiteController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/delete-site/index',
        {
          pageTitle: 'Are you sure you want to delete this site?',
          heading: 'Are you sure you want to delete this site?',
          siteNumber: '1',
          siteIndex: 0,
          backLink: routes.REVIEW_SITE_DETAILS,
          routes
        }
      )
    })

    it('should redirect to review page for file upload sites without allowing delete', async () => {
      const fileUploadRequest = {
        ...mockRequest,
        site: {
          ...mockRequest.site,
          siteDetails: {
            siteName: 'File Upload Site',
            coordinatesType: 'file'
          }
        }
      }

      await deleteSiteController.handler(fileUploadRequest, mockH)

      expect(mockH.view).not.toHaveBeenCalled()
      expect(authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    it('should have setSiteDataPreHandler in options', () => {
      expect(deleteSiteController.options.pre).toContain(setSiteDataPreHandler)
    })
  })

  describe('deleteSiteSubmitController.handler', () => {
    beforeEach(() => {
      authenticatedPatchRequest.mockResolvedValue({
        payload: { success: true }
      })
    })

    it('should make authenticated patch request with site removed and redirect', async () => {
      await deleteSiteSubmitController.handler(mockRequest, mockH)

      const expectedSiteDetails = [mockExemption.siteDetails[1]]

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        mockRequest,
        '/exemption/site-details',
        {
          multipleSiteDetails: mockExemption.multipleSiteDetails,
          siteDetails: expectedSiteDetails,
          id: mockExemption.id
        }
      )

      expect(setExemptionCache).toHaveBeenCalledWith(mockRequest, mockH, {
        ...mockExemption,
        siteDetails: expectedSiteDetails
      })

      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    it('should handle deleting the second site correctly', async () => {
      const requestDeleteSecondSite = {
        ...mockRequest,
        site: {
          siteNumber: '2',
          siteIndex: 1
        },
        payload: {
          siteIndex: '1'
        }
      }

      await deleteSiteSubmitController.handler(requestDeleteSecondSite, mockH)

      const expectedSiteDetails = [mockExemption.siteDetails[0]]

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        requestDeleteSecondSite,
        '/exemption/site-details',
        {
          multipleSiteDetails: mockExemption.multipleSiteDetails,
          siteDetails: expectedSiteDetails,
          id: mockExemption.id
        }
      )

      expect(setExemptionCache).toHaveBeenCalledWith(
        requestDeleteSecondSite,
        mockH,
        {
          ...mockExemption,
          siteDetails: expectedSiteDetails
        }
      )
    })

    it('should redirect to task list when deleting the last site', async () => {
      const exemptionWithOneSite = {
        ...mockExemption,
        siteDetails: [mockExemption.siteDetails[0]]
      }
      getExemptionCache.mockReturnValue(exemptionWithOneSite)

      await deleteSiteSubmitController.handler(mockRequest, mockH)

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        mockRequest,
        '/exemption/site-details',
        {
          multipleSiteDetails: exemptionWithOneSite.multipleSiteDetails,
          siteDetails: [],
          id: exemptionWithOneSite.id
        }
      )

      expect(setExemptionCache).toHaveBeenCalledWith(mockRequest, mockH, {
        ...exemptionWithOneSite,
        siteDetails: []
      })

      // Should redirect to task list instead of review site details
      expect(mockH.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
    })

    it('should handle invalid site index error', async () => {
      const requestWithInvalidSite = {
        ...mockRequest,
        payload: {
          siteIndex: '999'
        }
      }

      await deleteSiteSubmitController.handler(requestWithInvalidSite, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        { siteIndex: '999', exemptionId: mockExemption.id },
        'Invalid site index for deletion'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
      expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      authenticatedPatchRequest.mockRejectedValueOnce('test error')

      await deleteSiteSubmitController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })
  })
})
